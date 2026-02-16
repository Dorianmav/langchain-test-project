import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ISearchProvider, SearchResult, SearchConfig, SearXNGConfig } from '../interfaces';

/**
 * Provider de recherche SearXNG
 * 
 * Utilise une instance SearXNG locale (auto-hébergée)
 * Documentation: https://docs.searxng.org/
 */
@Injectable()
export class SearXNGProvider implements ISearchProvider {
  private readonly logger = new Logger(SearXNGProvider.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('SEARXNG_URL', 'http://localhost:8888');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; RAG-NestJS/1.0)',
        'X-Forwarded-For': '127.0.0.1',
      },
    });

    this.logger.log(`SearXNG provider initialized: ${this.baseUrl}`);
  }

  /**
   * Effectue une recherche avec SearXNG
   */
  async search(query: string, config?: SearXNGConfig): Promise<SearchResult[]> {
    const startTime = Date.now();

    try {
      const params: any = {
        q: query,
        format: 'json',
        language: config?.language || 'fr',
        pageno: 1,
      };

      // Ajouter les catégories si spécifiées
      if (config?.categories && config.categories.length > 0) {
        params.categories = config.categories.join(',');
      }

      // Ajouter les moteurs si spécifiés
      if (config?.engines && config.engines.length > 0) {
        params.engines = config.engines.join(',');
      }

      // Limiter les résultats
      const maxResults = config?.maxResults || 5;

      const response = await this.client.get('/search', { params });

      const duration = Date.now() - startTime;
      const results = response.data.results || [];
      
      this.logger.log(`✅ SearXNG search completed in ${duration}ms: "${query}" (${results.length} results)`);

      // Mapper et limiter les résultats
      return this.mapSearXNGResults(results).slice(0, maxResults);
    } catch (error) {
      const duration = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          this.logger.error('❌ SearXNG not available: Connection refused. Is the Docker container running?');
          throw new Error('SearXNG service unavailable');
        }

        if (error.response?.status === 404) {
          this.logger.error('❌ SearXNG endpoint not found. Check SEARXNG_URL configuration.');
          throw new Error('SearXNG endpoint not found');
        }

        this.logger.error(`❌ SearXNG API error (${error.response?.status}): ${error.message}`);
        throw new Error(`SearXNG search failed: ${error.message}`);
      }

      this.logger.error(`❌ SearXNG search failed after ${duration}ms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mappe les résultats SearXNG vers notre interface
   */
  private mapSearXNGResults(searxngResults: any[]): SearchResult[] {
    return searxngResults.map((result) => ({
      title: result.title || 'No title',
      url: result.url || '',
      snippet: result.content || result.snippet || '',
      score: this.calculateScore(result),
      metadata: {
        publishedDate: result.publishedDate,
        author: result.author,
        domain: this.extractDomain(result.url),
        imageUrl: result.img_src || result.thumbnail,
        raw: result,
      },
    }));
  }

  /**
   * Calcule un score de pertinence basé sur les métadonnées SearXNG
   */
  private calculateScore(result: any): number | undefined {
    // SearXNG ne fournit pas de score direct
    // On peut estimer basé sur la position et les métadonnées
    
    // Si le résultat a des métadonnées de score
    if (result.score !== undefined) {
      return result.score;
    }

    // Sinon, retourner undefined
    return undefined;
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
   * Vérifie la disponibilité de SearXNG
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Tester l'endpoint de recherche avec une requête simple
      const response = await this.client.get('/search', {
        params: {
          q: 'test',
          format: 'json',
        },
        timeout: 5000,
      });

      const isHealthy = response.status === 200 && response.data.results !== undefined;
      
      if (isHealthy) {
        this.logger.debug('✅ SearXNG health check passed');
      } else {
        this.logger.warn('⚠️  SearXNG health check: Unexpected response format');
      }

      return isHealthy;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          this.logger.error('❌ SearXNG health check failed: Connection refused');
        } else {
          this.logger.error(`❌ SearXNG health check failed: ${error.message}`);
        }
      } else {
        this.logger.error(`❌ SearXNG health check failed: ${error}`);
      }

      return false;
    }
  }

  /**
   * Retourne le nom du provider
   */
  getProviderName(): string {
    return 'searxng';
  }

  /**
   * Vérifie si le provider est disponible
   */
  async isAvailable(): Promise<boolean> {
    return this.healthCheck();
  }

  /**
   * Retourne les moteurs de recherche disponibles
   */
  async getAvailableEngines(): Promise<string[]> {
    try {
      const response = await this.client.get('/config');
      return response.data.engines?.map((e: any) => e.name) || [];
    } catch (error) {
      this.logger.warn('⚠️  Could not fetch available engines');
      return [];
    }
  }

  /**
   * Retourne les catégories disponibles
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      const response = await this.client.get('/config');
      return response.data.categories || [];
    } catch (error) {
      this.logger.warn('⚠️  Could not fetch available categories');
      return ['general', 'images', 'videos', 'news', 'map', 'music', 'it', 'science'];
    }
  }
}
