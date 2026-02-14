/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaProvider } from './providers/chroma.provider';
import { IVectorStoreProvider } from './interfaces/vector-store-provider.interface';
import { VectorStoreSearchService } from './services/vector-store-search.service';
import { VectorStoreCrudService } from './services/vector-store-crud.service';
import { VectorStoreHealthService } from './services/vector-store-health.service';

/**
 * Service principal pour le vector store
 * Orchestre les services spécialisés et gère le choix du provider
 */
@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);
  private currentProvider: IVectorStoreProvider;
  private providerName: string;
  private collectionName: string;

  constructor(
    private configService: ConfigService,
    private chromaProvider: ChromaProvider,
    private searchService: VectorStoreSearchService,
    private crudService: VectorStoreCrudService,
    private healthService: VectorStoreHealthService,
  ) {
    this.initializeProvider();
  }

  /**
   * Initialise le provider à utiliser
   */
  private async initializeProvider() {
    const vectorStoreType = this.configService.get<string>('VECTOR_STORE_TYPE', 'chroma');
    this.collectionName = this.configService.get<string>('CHROMA_COLLECTION_NAME', 'rag_documents');

    try {
      if (vectorStoreType === 'chroma') {
        const healthy = await this.chromaProvider.healthCheck();
        
        if (healthy) {
          this.currentProvider = this.chromaProvider;
          this.providerName = 'chroma';
          this.logger.log('✅ Using ChromaDB vector store (local)');
        } else {
          this.logger.error('❌ ChromaDB not available!');
          throw new Error('No vector store provider available');
        }
      }
    } catch (error) {
      this.logger.error('Vector store initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ajouter des documents au vector store (délégué au CRUD service)
   */
  async addDocuments(
    documents: Array<{ content: string; metadata?: Record<string, any> }>
  ): Promise<{ ids: string[]; count: number }> {
    return this.crudService.addDocuments(this.currentProvider, this.providerName, documents);
  }

  /**
   * Recherche par similarité avec cache (délégué au Search service)
   */
  async similaritySearch(
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
    return this.searchService.similaritySearch(
      this.currentProvider,
      this.providerName,
      this.collectionName,
      query,
      k,
      filter,
      includeScores
    );
  }

  /**
   * Supprimer des documents (délégué au CRUD service)
   */
  async deleteDocuments(ids: string[]): Promise<{ deleted: number; message: string }> {
    return this.crudService.deleteDocuments(this.currentProvider, this.providerName, ids);
  }

  /**
   * Mettre à jour un document (délégué au CRUD service)
   */
  async updateDocument(
    id: string,
    content?: string,
    metadata?: Record<string, any>
  ): Promise<{
    id: string;
    success: boolean;
    message: string;
    changes: { contentUpdated: boolean; metadataUpdated: boolean };
  }> {
    return this.crudService.updateDocument(this.currentProvider, id, content, metadata);
  }

  /**
   * Obtenir le nombre de documents (délégué au Health service)
   */
  async getDocumentCount(): Promise<{ count: number; provider: string }> {
    return this.healthService.getDocumentCount(this.currentProvider, this.providerName);
  }

  /**
   * Récupérer tous les documents (délégué au CRUD service)
   */
  async getAllDocuments(
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    documents: Array<{ id: string; content: string; metadata: Record<string, any> }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    return this.crudService.getAllDocuments(this.currentProvider, limit, offset);
  }

  /**
   * Obtenir les informations du vector store (délégué au Health service)
   */
  getVectorStoreInfo() {
    return this.healthService.getVectorStoreInfo(this.providerName, this.collectionName);
  }

  /**
   * Health check (délégué au Health service)
   */
  async healthCheck(): Promise<{
    vectorStore: boolean;
    embeddings: boolean;
    provider: string;
  }> {
    return this.healthService.healthCheck(this.currentProvider, this.providerName);
  }

  /**
   * Obtenir un document par son ID (délégué au CRUD service)
   */
  async getDocumentById(id: string) {
    return this.crudService.getDocumentById(this.currentProvider, id);
  }
}
