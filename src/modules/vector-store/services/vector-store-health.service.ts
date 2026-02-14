import { Injectable, Logger } from '@nestjs/common';
import { IVectorStoreProvider } from '../interfaces/vector-store-provider.interface';
import { EmbeddingsService } from '../../embeddings/embeddings.service';

/**
 * Service responsable des informations et du health check
 */
@Injectable()
export class VectorStoreHealthService {
  private readonly logger = new Logger(VectorStoreHealthService.name);

  constructor(
    private embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Obtenir le nombre de documents
   */
  async getDocumentCount(
    provider: IVectorStoreProvider,
    providerName: string
  ): Promise<{ count: number; provider: string }> {
    try {
      const count = await provider.getDocumentCount();

      return {
        count,
        provider: providerName,
      };
    } catch (error) {
      this.logger.error('Get document count failed:', error);
      return {
        count: 0,
        provider: providerName,
      };
    }
  }

  /**
   * Obtenir les informations du vector store
   */
  getVectorStoreInfo(
    providerName: string,
    collectionName: string
  ) {
    const embeddingsInfo = this.embeddingsService.getModelInfo();

    return {
      provider: providerName,
      collection: collectionName,
      embeddings: embeddingsInfo,
    };
  }

  /**
   * Health check
   */
  async healthCheck(
    provider: IVectorStoreProvider,
    providerName: string
  ): Promise<{
    vectorStore: boolean;
    embeddings: boolean;
    provider: string;
  }> {
    const [vectorStoreHealthy, embeddingsHealth] = await Promise.all([
      provider.healthCheck(),
      this.embeddingsService.healthCheck(),
    ]);

    return {
      vectorStore: vectorStoreHealthy,
      embeddings: embeddingsHealth.healthy,
      provider: providerName,
    };
  }
}
