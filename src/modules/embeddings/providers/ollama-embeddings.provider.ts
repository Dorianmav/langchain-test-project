import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaEmbeddings } from '@langchain/ollama';
import { IEmbeddingsProvider, EmbeddingMetadata } from '../interfaces/embeddings-provider.interface';

/**
 * Provider Ollama pour embeddings locaux
 * Modèle recommandé: nomic-embed-text (dimension: 768)
 */
@Injectable()
export class OllamaEmbeddingsProvider implements IEmbeddingsProvider {
  private readonly logger = new Logger(OllamaEmbeddingsProvider.name);
  private embeddings: OllamaEmbeddings;
  private baseUrl: string;
  private model: string;
  private dimension: number;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL', 'http://ollama:11434');
    this.model = this.configService.get<string>('EMBEDDINGS_MODEL', 'nomic-embed-text');
    this.dimension = 768; // nomic-embed-text utilise 768 dimensions

    this.initializeEmbeddings();
  }

  /**
   * Initialise le client Ollama Embeddings
   */
  private initializeEmbeddings() {
    this.embeddings = new OllamaEmbeddings({
      baseUrl: this.baseUrl,
      model: this.model,
    });

    this.logger.log(`Ollama Embeddings initialized: ${this.baseUrl} - Model: ${this.model}`);
  }

  /**
   * Génère un embedding pour une requête (query)
   */
  async embedQuery(text: string): Promise<number[]> {
    try {
      const startTime = Date.now();
      const embedding = await this.embeddings.embedQuery(text);
      const duration = Date.now() - startTime;

      this.logger.debug(`Query embedded in ${duration}ms (${embedding.length} dimensions)`);
      return embedding;
    } catch (error) {
      this.logger.error('Ollama embedQuery error:', error);
      throw new Error(`Ollama embedQuery failed: ${error.message}`);
    }
  }

  /**
   * Génère des embeddings pour plusieurs documents
   */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    try {
      const startTime = Date.now();
      const embeddings = await this.embeddings.embedDocuments(documents);
      const duration = Date.now() - startTime;

      this.logger.debug(`${documents.length} documents embedded in ${duration}ms`);
      return embeddings;
    } catch (error) {
      this.logger.error('Ollama embedDocuments error:', error);
      throw new Error(`Ollama embedDocuments failed: ${error.message}`);
    }
  }

  /**
   * Obtenir la dimension des embeddings
   */
  getDimension(): number {
    return this.dimension;
  }

  /**
   * Obtenir le nom du modèle
   */
  getModelName(): string {
    return this.model;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test avec un texte court
      await this.embedQuery('test');
      return true;
    } catch (error) {
      this.logger.error('Ollama Embeddings health check failed:', error);
      return false;
    }
  }

  /**
   * Obtenir l'instance LangChain (pour utilisation dans vector stores)
   */
  getEmbeddingsInstance(): OllamaEmbeddings {
    return this.embeddings;
  }
}