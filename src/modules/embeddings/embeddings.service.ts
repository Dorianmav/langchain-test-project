/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaEmbeddingsProvider } from './providers/ollama-embeddings.provider';
import { IEmbeddingsProvider, EmbeddingMetadata } from './interfaces/embeddings-provider.interface';

/**
 * Service principal pour les embeddings
 * Gère automatiquement le choix du provider
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private currentProvider: IEmbeddingsProvider;
  private providerName: string;

  constructor(
    private configService: ConfigService,
    private ollamaEmbeddingsProvider: OllamaEmbeddingsProvider,
  ) {
    this.initializeProvider();
  }

  /**
   * Initialise le provider à utiliser
   */
  private async initializeProvider() {
    const providerType = this.configService.get<string>('EMBEDDINGS_PROVIDER', 'ollama');

    if (providerType === 'ollama') {
      const healthy = await this.ollamaEmbeddingsProvider.healthCheck();
      
      if (healthy) {
        this.currentProvider = this.ollamaEmbeddingsProvider;
        this.providerName = 'ollama';
        this.logger.log('✅ Using Ollama Embeddings provider (local)');
      } else {
        this.logger.error('❌ Ollama Embeddings provider not available!');
        throw new Error('No embeddings provider available');
      }
    }
  }

  /**
   * Génère un embedding pour une requête
   */
  async embedQuery(text: string): Promise<{ embedding: number[]; metadata: EmbeddingMetadata }> {
    const startTime = Date.now();

    try {
      const embedding = await this.currentProvider.embedQuery(text);
      
      const metadata: EmbeddingMetadata = {
        provider: this.providerName,
        model: this.currentProvider.getModelName(),
        dimension: this.currentProvider.getDimension(),
        duration: Date.now() - startTime,
      };

      return { embedding, metadata };
    } catch (error) {
      this.logger.error('embedQuery failed:', error);
      throw error;
    }
  }

  /**
   * Génère des embeddings pour plusieurs documents
   */
  async embedDocuments(documents: string[]): Promise<{ embeddings: number[][]; metadata: EmbeddingMetadata }> {
    const startTime = Date.now();

    try {
      const embeddings = await this.currentProvider.embedDocuments(documents);
      
      const metadata: EmbeddingMetadata = {
        provider: this.providerName,
        model: this.currentProvider.getModelName(),
        dimension: this.currentProvider.getDimension(),
        duration: Date.now() - startTime,
      };

      return { embeddings, metadata };
    } catch (error) {
      this.logger.error('embedDocuments failed:', error);
      throw error;
    }
  }

  /**
   * Obtenir le provider actuel
   */
  getCurrentProvider(): string {
    return this.providerName;
  }

  /**
   * Obtenir les informations du modèle
   */
  getModelInfo() {
    return {
      provider: this.providerName,
      model: this.currentProvider.getModelName(),
      dimension: this.currentProvider.getDimension(),
    };
  }

  /**
   * Obtenir l'instance du provider (pour vector stores)
   */
  getProviderInstance(): IEmbeddingsProvider {
    return this.currentProvider;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ provider: string; healthy: boolean }> {
    const healthy = await this.currentProvider.healthCheck();
    return {
      provider: this.providerName,
      healthy,
    };
  }
}
