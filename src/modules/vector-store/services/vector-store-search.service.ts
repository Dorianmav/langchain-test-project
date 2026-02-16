import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/cache/redis.service';
import { IVectorStoreProvider } from '../interfaces/vector-store-provider.interface';
import { EmbeddingsService } from '../../embeddings/embeddings.service';

/**
 * Service responsable de la recherche de similarité avec cache Redis
 */
@Injectable()
export class VectorStoreSearchService {
  private readonly logger = new Logger(VectorStoreSearchService.name);
  private readonly namespace = 'embeddings';

  constructor(
    private embeddingsService: EmbeddingsService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Recherche par similarité avec cache Redis (namespace 'embeddings:')
   */
  async similaritySearch(
    provider: IVectorStoreProvider,
    providerName: string,
    collectionName: string,
    query: string,
    k: number = 4,
    filter?: Record<string, any>,
    includeScores: boolean = false
  ): Promise<{
    documents: Array<{
      id?: string;
      content: string;
      metadata: Record<string, any>;
      score?: number;
    }>;
    metadata: {
      provider: string;
      collection: string;
      embeddingsModel: string;
      searchDuration: number;
      cached?: boolean;
    };
  }> {
    // Générer une clé de cache (sans namespace, géré par RedisService)
    const cacheKey = `${collectionName}:${query}:${k}:${JSON.stringify(filter)}:${includeScores}`;
    
    // Vérifier le cache Redis
    const cached = await this.redisService.get(this.namespace, cacheKey);
    if (cached) {
      this.logger.debug(`✅ Cache hit for query: "${query}"`);
      return {
        ...(cached as any),
        metadata: {
          ...(cached as any).metadata,
          cached: true,
        },
      };
    }

    const startTime = Date.now();

    try {
      let results: Array<{ content: string; metadata: Record<string, any>; score?: number }>;

      if (includeScores) {
        // Recherche avec scores
        const resultsWithScores = await provider.similaritySearchWithScore(query, k);
        
        results = resultsWithScores.map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: score,
        }));
      } else {
        // Recherche simple
        const docs = await provider.similaritySearch(query, k, filter);
        
        results = docs.map(doc => ({
          content: doc.pageContent,
          metadata: doc.metadata,
        }));
      }

      const searchDuration = Date.now() - startTime;
      const embeddingsInfo = this.embeddingsService.getModelInfo();

      this.logger.log(`✅ Found ${results.length} similar documents in ${searchDuration}ms`);

      const response = {
        documents: results,
        metadata: {
          provider: providerName,
          collection: collectionName,
          embeddingsModel: embeddingsInfo.model,
          searchDuration,
          cached: false,
        },
      };

      // Mettre en cache le résultat avec Redis (5 minutes = 300 secondes)
      await this.redisService.set(this.namespace, cacheKey, response, 300);

      return response;
    } catch (error) {
      this.logger.error('Similarity search failed:', error);
      throw error;
    }
  }
}
