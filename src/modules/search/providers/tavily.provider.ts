import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  ISearchProvider,
  SearchResult,
  TavilyConfig,
  TavilyExtractConfig,
  TavilyResearchConfig,
} from '../interfaces';

/**
 * Provider de recherche Tavily
 * 
 * Utilise l'API Tavily pour des recherches web de haute qualité
 * Documentation: https://docs.tavily.com/
 */
@Injectable()
export class TavilyProvider implements ISearchProvider {
  private readonly logger = new Logger(TavilyProvider.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.tavily.com';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TAVILY_API_KEY', '');

    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      this.logger.warn('⚠️  Tavily API key not configured. Provider will be unavailable.');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Effectue une recherche avec Tavily
   */
  async search(query: string, config?: TavilyConfig): Promise<SearchResult[]> {
    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      throw new Error('Tavily API key not configured');
    }

    const startTime = Date.now();

    try {
      const response = await this.client.post('/search', {
        api_key: this.apiKey,
        query,
        search_depth: config?.searchDepth || 'basic',
        include_answer: config?.includeAnswer ?? false,
        include_raw_content: config?.includeRawContent ?? false,
        max_results: config?.maxResults || 5,
        include_images: config?.includeImages ?? false,
        include_domains: config?.includeDomains || [],
        exclude_domains: config?.excludeDomains || [],
      });

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Tavily search completed in ${duration}ms: "${query}" (${response.data.results?.length || 0} results)`);

      return this.mapTavilyResults(response.data.results || []);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          this.logger.error('❌ Tavily API quota exceeded');
          throw new Error('Tavily quota exceeded');
        }
        
        if (error.response?.status === 401) {
          this.logger.error('❌ Tavily API authentication failed');
          throw new Error('Invalid Tavily API key');
        }

        this.logger.error(`❌ Tavily API error (${error.response?.status}): ${error.message}`);
        throw new Error(`Tavily search failed: ${error.response?.data?.message || error.message}`);
      }

      this.logger.error(`❌ Tavily search failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mappe les résultats Tavily vers notre interface
   */
  private mapTavilyResults(tavilyResults: any[]): SearchResult[] {
    return tavilyResults.map((result) => ({
      title: result.title || 'No title',
      url: result.url || '',
      snippet: result.content || result.snippet || '',
      score: result.score || undefined,
      metadata: {
        publishedDate: result.published_date,
        domain: this.extractDomain(result.url),
        imageUrl: result.image_url,
        raw: result,
      },
    }));
  }

  /**
   * Extrait le domaine d'une URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Vérifie la disponibilité de l'API Tavily
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      return false;
    }

    try {
      // Test avec une requête simple
      await this.client.post('/search', {
        api_key: this.apiKey,
        query: 'test',
        max_results: 1,
      });

      this.logger.debug('✅ Tavily health check passed');
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 401 = API key invalide
        if (error.response?.status === 401) {
          this.logger.error('❌ Tavily health check failed: Invalid API key');
          return false;
        }

        // 429 = Quota dépassé (mais API fonctionnelle)
        if (error.response?.status === 429) {
          this.logger.warn('⚠️  Tavily health check: Quota exceeded but API is available');
          return true; // API disponible, juste le quota dépassé
        }
      }

      this.logger.error(`❌ Tavily health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Retourne le nom du provider
   */
  getProviderName(): string {
    return 'tavily';
  }

  /**
   * Vérifie si le provider est disponible
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      return false;
    }

    return this.healthCheck();
  }

  // ==================== ENDPOINTS ADDITIONNELS TAVILY ====================

  /**
   * Extrait le contenu d'URLs spécifiques
   * https://docs.tavily.com/documentation/api-reference/endpoint/extract
   */
  async extract(config: TavilyExtractConfig): Promise<Array<{
    url: string;
    rawContent: string;
    title?: string;
    author?: string;
    publishedDate?: string;
  }>> {
    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      throw new Error('Tavily API key not configured');
    }

    const startTime = Date.now();

    try {
      const response = await this.client.post('/extract', {
        api_key: this.apiKey,
        urls: config.urls,
        include_raw_content: config.includeRawContent ?? true,
      });

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Tavily extract completed in ${duration}ms: ${config.urls.length} URLs`);

      return response.data.results || [];
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleTavilyError(error, 'extract', duration);
      throw error;
    }
  }

  /**
   * Effectue une recherche approfondie avec synthèse
   * https://docs.tavily.com/documentation/api-reference/endpoint/research
   */
  async research(config: TavilyResearchConfig): Promise<{
    answer: string;
    sources: SearchResult[];
    images?: string[];
    followUpQuestions?: string[];
  }> {
    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      throw new Error('Tavily API key not configured');
    }

    const startTime = Date.now();

    try {
      const response = await this.client.post('/research', {
        api_key: this.apiKey,
        query: config.query,
        max_sources: config.maxSources || 5,
        search_depth: config.searchDepth || 'advanced',
        include_images: config.includeImages ?? false,
        include_raw_content: config.includeRawContent ?? false,
      });

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Tavily research completed in ${duration}ms: "${config.query}"`);

      return {
        answer: response.data.answer || '',
        sources: this.mapTavilyResults(response.data.sources || []),
        images: response.data.images || [],
        followUpQuestions: response.data.follow_up_questions || [],
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleTavilyError(error, 'research', duration);
      throw error;
    }
  }

  /**
   * Crawle et extrait le contenu d'un site web
   * https://docs.tavily.com/documentation/api-reference/endpoint/crawl
   */
  async crawl(config: {
    url: string;
    maxPages?: number;
    includeRawContent?: boolean;
  }): Promise<Array<{
    url: string;
    title: string;
    content: string;
    rawContent?: string;
    links?: string[];
  }>> {
    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      throw new Error('Tavily API key not configured');
    }

    const startTime = Date.now();

    try {
      const response = await this.client.post('/crawl', {
        api_key: this.apiKey,
        url: config.url,
        max_pages: config.maxPages || 10,
        include_raw_content: config.includeRawContent ?? false,
      });

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Tavily crawl completed in ${duration}ms: ${config.url}`);

      return response.data.results || [];
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleTavilyError(error, 'crawl', duration);
      throw error;
    }
  }

  /**
   * Mappe les relations entre entités dans une requête
   * https://docs.tavily.com/documentation/api-reference/endpoint/map
   */
  async map(config: {
    query: string;
    entities?: string[];
    maxResults?: number;
  }): Promise<{
    entities: Array<{
      name: string;
      type: string;
      description: string;
      relations: Array<{
        target: string;
        type: string;
        description: string;
      }>;
    }>;
    graph: {
      nodes: Array<{ id: string; label: string; type: string }>;
      edges: Array<{ source: string; target: string; label: string }>;
    };
  }> {
    if (!this.apiKey || this.apiKey === 'your_tavily_api_key_here') {
      throw new Error('Tavily API key not configured');
    }

    const startTime = Date.now();

    try {
      const response = await this.client.post('/map', {
        api_key: this.apiKey,
        query: config.query,
        entities: config.entities || [],
        max_results: config.maxResults || 10,
      });

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Tavily map completed in ${duration}ms: "${config.query}"`);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleTavilyError(error, 'map', duration);
      throw error;
    }
  }

  /**
   * Gestion centralisée des erreurs Tavily
   */
  private handleTavilyError(error: any, endpoint: string, duration: number): void {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        this.logger.error(`❌ Tavily ${endpoint} quota exceeded`);
        throw new Error('Tavily quota exceeded');
      }

      if (error.response?.status === 401) {
        this.logger.error(`❌ Tavily ${endpoint} authentication failed`);
        throw new Error('Invalid Tavily API key');
      }

      this.logger.error(`❌ Tavily ${endpoint} error (${error.response?.status}): ${error.message}`);
      throw new Error(`Tavily ${endpoint} failed: ${error.response?.data?.message || error.message}`);
    }

    this.logger.error(`❌ Tavily ${endpoint} failed after ${duration}ms: ${error.message}`);
  }
}
