/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/cache/redis.service';
import { TavilyProvider, SearXNGProvider } from './providers';
import { QueryComplexityService, QuotaManagerService } from './services';
import { SearchRequestDto, WebSearchResponseDto } from './dto';
import { SearchMetadata, ISearchProvider } from './interfaces';

/**
 * Service principal de recherche web
 * 
 * Orchestre la sélection du provider (Tavily/SearXNG) basée sur:
 * - La complexité détectée de la requête
 * - Le quota Tavily disponible
 * - La disponibilité des providers
 * 
 * Implémente un cache Redis avec namespace 'search:*' et un fallback automatique
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly namespace = 'search';

  constructor(
    private readonly redisService: RedisService,
    private readonly tavilyProvider: TavilyProvider,
    private readonly searxngProvider: SearXNGProvider,
    private readonly complexityService: QueryComplexityService,
    private readonly quotaManager: QuotaManagerService,
  ) {}

  /**
   * Effectue une recherche web avec sélection automatique du provider
   */
  async search(dto: SearchRequestDto): Promise<WebSearchResponseDto> {
    const startTime = Date.now();
    const { query, forceProvider = 'auto' } = dto;

    this.logger.log(`🔍 Search request: "${query}" (provider: ${forceProvider})`);

    // Vérifier le cache Redis
    const cacheKey = this.generateCacheKey(dto);
    const cached = await this.redisService.get<WebSearchResponseDto>(this.namespace, cacheKey);

    if (cached) {
      this.logger.log(`✅ Cache hit for: "${query}"`);
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          duration: Date.now() - startTime,
        },
      };
    }

    // Sélectionner le provider
    let provider: ISearchProvider;
    let providerName: string;
    let fallbackReason: string | undefined;

    if (forceProvider === 'tavily') {
      provider = this.tavilyProvider;
      providerName = 'tavily';
    } else if (forceProvider === 'searxng') {
      provider = this.searxngProvider;
      providerName = 'searxng';
    } else {
      // Sélection automatique
      const selection = await this.selectProvider(query);
      provider = selection.provider;
      providerName = selection.providerName;
      fallbackReason = selection.fallbackReason;
    }

    try {
      // Effectuer la recherche
      const results = await provider.search(query, {
        maxResults: dto.maxResults,
        language: dto.language,
        region: dto.region,
        timeRange: dto.timeRange,
        includeImages: dto.includeImages,
        includeDomains: dto.includeDomains,
        excludeDomains: dto.excludeDomains,
      });

      // Incrémenter le quota si Tavily est utilisé
      if (providerName === 'tavily') {
        this.quotaManager.incrementUsage();
      }

      const duration = Date.now() - startTime;

      // Construire la réponse
      const response: WebSearchResponseDto = {
        results,
        query,
        totalResults: results.length,
        metadata: this.buildMetadata({
          provider: providerName,
          query,
          duration,
          cached: false,
          fallbackReason,
        }),
      };

      // Mettre en cache Redis avec namespace 'search:' (1 heure)
      await this.redisService.set(this.namespace, cacheKey, response, 3600);

      this.logger.log(`✅ Search completed: "${query}" via ${providerName} (${duration}ms, ${results.length} results)`);

      return response;
    } catch (error) {
      this.logger.error(`❌ Search failed with ${providerName}: ${error.message}`);

      // Tentative de fallback si le provider principal échoue
      if (forceProvider === 'auto') {
        return this.searchWithFallback(dto, providerName, error.message);
      }

      throw error;
    }
  }

  /**
   * Sélectionne le provider approprié basé sur la complexité et le quota
   */
  private async selectProvider(query: string): Promise<{
    provider: ISearchProvider;
    providerName: string;
    fallbackReason?: string;
  }> {
    // Analyser la complexité
    const analysis = this.complexityService.analyzeQuery(query);
    
    this.logger.debug(
      `Query analysis: complexity=${analysis.complexity}, ` +
      `recommended=${analysis.recommendedProvider}, ` +
      `wordCount=${analysis.wordCount}, ` +
      `technical=${analysis.hasTechnicalKeywords}`
    );

    // Vérifier le quota Tavily
    const quotaExceeded = this.quotaManager.isQuotaExceeded();
    const quotaRemaining = this.quotaManager.getRemainingQuota();

    if (quotaExceeded) {
      this.logger.warn(`⚠️  Tavily quota exceeded, forcing SearXNG`);
      return {
        provider: this.searxngProvider,
        providerName: 'searxng',
        fallbackReason: 'Tavily quota exceeded',
      };
    }

    // Stratégie de sélection:
    // - LOW complexity → SearXNG
    // - MEDIUM/HIGH complexity → Tavily (si quota disponible)
    if (analysis.recommendedProvider === 'tavily') {
      // Vérifier disponibilité de Tavily
      const tavilyAvailable = await this.tavilyProvider.isAvailable();

      if (tavilyAvailable) {
        this.logger.debug(`📊 Selected Tavily (quota remaining: ${quotaRemaining})`);
        return {
          provider: this.tavilyProvider,
          providerName: 'tavily',
        };
      } else {
        this.logger.warn('⚠️  Tavily unavailable, falling back to SearXNG');
        return {
          provider: this.searxngProvider,
          providerName: 'searxng',
          fallbackReason: 'Tavily unavailable',
        };
      }
    } else {
      // Requête simple → SearXNG
      this.logger.debug('📊 Selected SearXNG (low complexity query)');
      return {
        provider: this.searxngProvider,
        providerName: 'searxng',
      };
    }
  }

  /**
   * Recherche avec fallback automatique
   */
  private async searchWithFallback(
    dto: SearchRequestDto,
    failedProvider: string,
    error: string,
  ): Promise<WebSearchResponseDto> {
    const fallbackProvider = failedProvider === 'tavily' ? 'searxng' : 'tavily';
    
    this.logger.warn(`⚠️  Attempting fallback to ${fallbackProvider} after ${failedProvider} failure`);

    const provider = fallbackProvider === 'tavily' ? this.tavilyProvider : this.searxngProvider;

    try {
      const startTime = Date.now();
      const results = await provider.search(dto.query, {
        maxResults: dto.maxResults,
        language: dto.language,
        region: dto.region,
        timeRange: dto.timeRange,
        includeImages: dto.includeImages,
        includeDomains: dto.includeDomains,
        excludeDomains: dto.excludeDomains,
      });

      if (fallbackProvider === 'tavily') {
        this.quotaManager.incrementUsage();
      }

      const duration = Date.now() - startTime;

      this.logger.log(`✅ Fallback successful: ${fallbackProvider} (${duration}ms, ${results.length} results)`);

      return {
        results,
        query: dto.query,
        totalResults: results.length,
        metadata: this.buildMetadata({
          provider: fallbackProvider,
          query: dto.query,
          duration,
          cached: false,
          fallbackReason: `${failedProvider} failed: ${error}`,
        }),
      };
    } catch (fallbackError) {
      this.logger.error(`❌ Fallback also failed: ${fallbackError.message}`);
      throw new Error(`Both providers failed. Primary: ${error}, Fallback: ${fallbackError.message}`);
    }
  }

  /**
   * Construit les métadonnées de la réponse
   */
  private buildMetadata(params: {
    provider: string;
    query: string;
    duration: number;
    cached: boolean;
    fallbackReason?: string;
  }): SearchMetadata {
    const complexity = this.complexityService.detectComplexity(params.query);
    const quotaStats = this.quotaManager.getUsageStats();

    return {
      provider: params.provider,
      complexity,
      duration: params.duration,
      cached: params.cached,
      quotaRemaining: params.provider === 'tavily' ? quotaStats.remainingQuota : undefined,
      fallbackReason: params.fallbackReason,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Génère une clé de cache unique (sans le namespace qui est géré par RedisService)
   */
  private generateCacheKey(dto: SearchRequestDto): string {
    const parts = [
      dto.query,
      dto.maxResults,
      dto.language,
      dto.region,
      dto.timeRange,
      dto.includeImages,
      dto.includeDomains?.join(','),
      dto.excludeDomains?.join(','),
    ].filter(Boolean);

    return parts.join(':');
  }

  /**
   * Vide le cache de recherche (pattern-based avec Redis KEYS search:*)
   */
  async clearCache(): Promise<{ cleared: number }> {
    const cleared = await this.redisService.clearPattern(this.namespace);
    this.logger.log(`✅ Search cache cleared: ${cleared} keys deleted`);
    return { cleared };
  }

  /**
   * Retourne les statistiques de quota Tavily
   */
  getQuotaStats() {
    return this.quotaManager.getUsageStats();
  }

  /**
   * Force un reset du quota Tavily
   */
  resetQuota(): void {
    this.quotaManager.forceReset();
  }

  /**
   * Vérifie la santé des providers
   */
  async checkProvidersHealth(): Promise<{
    tavily: boolean;
    searxng: boolean;
  }> {
    const [tavily, searxng] = await Promise.all([
      this.tavilyProvider.healthCheck(),
      this.searxngProvider.healthCheck(),
    ]);

    return { tavily, searxng };
  }
}

