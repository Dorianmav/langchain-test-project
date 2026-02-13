/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Document } from '@langchain/core/documents';
import { ChromaProvider } from './providers/chroma.provider';
import { IVectorStoreProvider } from './interfaces/vector-store-provider.interface';
import { EmbeddingsService } from '../embeddings/embeddings.service';

/**
 * Service principal pour le vector store
 * Gère automatiquement le choix du provider (ChromaDB, Qdrant, etc.)
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
    private embeddingsService: EmbeddingsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
   * Ajouter des documents au vector store
   */
  async addDocuments(
    documents: Array<{ content: string; metadata?: Record<string, any> }>
  ): Promise<{ ids: string[]; count: number }> {
    try {
      // Convertir en format LangChain Document
      const langchainDocs = documents.map(doc => new Document({
        pageContent: doc.content,
        metadata: doc.metadata || {},
      }));

      const ids = await this.currentProvider.addDocuments(langchainDocs);

      this.logger.log(`✅ Added ${ids.length} documents to ${this.providerName}`);

      return {
        ids,
        count: ids.length,
      };
    } catch (error) {
      this.logger.error('Add documents failed:', error);
      throw error;
    }
  }

  /**
   * Recherche par similarité avec cache
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
    // Générer une clé de cache
    const cacheKey = `search:${query}:${k}:${JSON.stringify(filter)}:${includeScores}`;
    
    // Vérifier le cache
    const cached = await this.cacheManager.get(cacheKey);
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
        const resultsWithScores = await this.currentProvider.similaritySearchWithScore(query, k);
        
        results = resultsWithScores.map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: score,
        }));
      } else {
        // Recherche simple
        const docs = await this.currentProvider.similaritySearch(query, k, filter);
        
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
          provider: this.providerName,
          collection: this.collectionName,
          embeddingsModel: embeddingsInfo.model,
          searchDuration,
          cached: false,
        },
      };

      // Mettre en cache le résultat
      await this.cacheManager.set(cacheKey, response, 300000); // 5 minutes

      return response;
    } catch (error) {
      this.logger.error('Similarity search failed:', error);
      throw error;
    }
  }

  /**
   * Supprimer des documents
   */
  async deleteDocuments(ids: string[]): Promise<{ deleted: number; message: string }> {
    try {
      await this.currentProvider.deleteDocuments(ids);

      this.logger.log(`✅ Deleted ${ids.length} documents from ${this.providerName}`);

      return {
        deleted: ids.length,
        message: `Successfully deleted ${ids.length} document(s)`,
      };
    } catch (error) {
      this.logger.error('Delete documents failed:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un document
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
    try {
      const success = await this.currentProvider.updateDocument(id, content, metadata);

      if (!success) {
        return {
          id,
          success: false,
          message: 'Document not found or update failed',
          changes: { contentUpdated: false, metadataUpdated: false },
        };
      }

      const contentUpdated = content !== undefined;
      const metadataUpdated = metadata !== undefined;

      this.logger.log(`✅ Updated document ${id} (content: ${contentUpdated}, metadata: ${metadataUpdated})`);

      return {
        id,
        success: true,
        message: 'Document updated successfully',
        changes: { contentUpdated, metadataUpdated },
      };
    } catch (error) {
      this.logger.error('Update document failed:', error);
      throw error;
    }
  }

  /**
   * Obtenir le nombre de documents
   */
  async getDocumentCount(): Promise<{ count: number; provider: string }> {
    try {
      const count = await this.currentProvider.getDocumentCount();

      return {
        count,
        provider: this.providerName,
      };
    } catch (error) {
      this.logger.error('Get document count failed:', error);
      return {
        count: 0,
        provider: this.providerName,
      };
    }
  }

  /**
   * Récupérer tous les documents avec leurs IDs
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
    try {
      const documents = await this.currentProvider.getAllDocuments(limit, offset);
      const totalCount = await this.currentProvider.getDocumentCount();

      this.logger.log(`✅ Retrieved ${documents.length} documents (total: ${totalCount})`);

      return {
        documents,
        total: totalCount,
        limit,
        offset,
      };
    } catch (error) {
      this.logger.error('Get all documents failed:', error);
      throw error;
    }
  }

  /**
   * Obtenir les informations du vector store
   */
  getVectorStoreInfo() {
    const embeddingsInfo = this.embeddingsService.getModelInfo();

    return {
      provider: this.providerName,
      collection: this.collectionName,
      embeddings: embeddingsInfo,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    vectorStore: boolean;
    embeddings: boolean;
    provider: string;
  }> {
    const [vectorStoreHealthy, embeddingsHealth] = await Promise.all([
      this.currentProvider.healthCheck(),
      this.embeddingsService.healthCheck(),
    ]);

    return {
      vectorStore: vectorStoreHealthy,
      embeddings: embeddingsHealth.healthy,
      provider: this.providerName,
    };
  }

  /**
   * Obtenir un document par son ID
   */
  async getDocumentById(id: string) {
    try {
      const document = await this.currentProvider.getDocumentById(id);
      
      if (!document) {
        return null;
      }

      this.logger.log(`✅ Retrieved document ${id}`);
      return document;
    } catch (error) {
      this.logger.error('Get document by ID failed:', error);
      throw error;
    }
  }
}
