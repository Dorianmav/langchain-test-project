import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';
import { ChromaClient, Collection } from 'chromadb';
import { IVectorStoreProvider, VectorStoreConfig } from '../interfaces/vector-store-provider.interface';
import { EmbeddingsService } from '../../embeddings/embeddings.service';

/**
 * Provider ChromaDB pour vector store local
 * Approche hybride: LangChain pour les opérations, ChromaDB natif pour les métadonnées
 */
@Injectable()
export class ChromaProvider implements IVectorStoreProvider {
  private readonly logger = new Logger(ChromaProvider.name);
  private vectorStore: Chroma;
  private chromaClient: ChromaClient;
  private collection: Collection;
  private url: string;
  private collectionName: string;

  constructor(
    private configService: ConfigService,
    private embeddingsService: EmbeddingsService,
  ) {
    this.url = this.configService.get<string>('CHROMA_URL', 'http://chroma:8000');
    this.collectionName = this.configService.get<string>('CHROMA_COLLECTION_NAME', 'rag_documents');
    this.initializeNativeClient();
  }

  /**
   * Initialise le client ChromaDB natif
   */
  private initializeNativeClient() {
    this.chromaClient = new ChromaClient({ path: this.url });
    this.logger.log(`ChromaDB native client initialized: ${this.url}`);
  }

  /**
   * Initialise le vector store LangChain et la collection native
   */
  private async initializeVectorStore(): Promise<Chroma> {
    if (this.vectorStore) {
      return this.vectorStore;
    }

    try {
      // Récupérer l'instance d'embeddings Ollama
      const embeddingsProvider = this.embeddingsService.getProviderInstance();
      
      // Casting vers OllamaEmbeddingsProvider pour accéder à getEmbeddingsInstance
      const embeddingsInstance = (embeddingsProvider as any).getEmbeddingsInstance();

      this.vectorStore = await Chroma.fromExistingCollection(
        embeddingsInstance,
        {
          url: this.url,
          collectionName: this.collectionName,
        }
      );

      // Initialiser la collection native pour accès aux métadonnées
      try {
        this.collection = await this.chromaClient.getCollection({ name: this.collectionName });
        this.logger.log(`ChromaDB collection accessed: ${this.collectionName}`);
      } catch (collectionError) {
        this.logger.warn(`Collection ${this.collectionName} not found, will be created on first add`);
      }

      this.logger.log(`ChromaDB initialized: ${this.url} - Collection: ${this.collectionName}`);
      return this.vectorStore;
    } catch (error) {
      this.logger.error('ChromaDB initialization error:', error);
      throw new Error(`ChromaDB initialization failed: ${error.message}`);
    }
  }

  /**
   * Ajouter des documents
   */
  async addDocuments(documents: Document[]): Promise<string[]> {
    try {
      const store = await this.initializeVectorStore();
      
      const ids = await store.addDocuments(documents);
      
      // Rafraîchir la collection native après ajout
      if (!this.collection) {
        try {
          this.collection = await this.chromaClient.getCollection({ name: this.collectionName });
        } catch (e) {
          this.logger.warn('Could not refresh native collection reference');
        }
      }
      
      this.logger.log(`Added ${documents.length} documents to ChromaDB`);
      return ids;
    } catch (error) {
      this.logger.error('Add documents error:', error);
      throw new Error(`Failed to add documents: ${error.message}`);
    }
  }

  /**
   * Recherche par similarité
   */
  async similaritySearch(
    query: string, 
    k: number = 4,
    filter?: Record<string, any>
  ): Promise<Document[]> {
    try {
      const store = await this.initializeVectorStore();
      
      const results = await store.similaritySearch(query, k, filter);
      
      this.logger.debug(`Found ${results.length} similar documents`);
      return results;
    } catch (error) {
      this.logger.error('Similarity search error:', error);
      throw new Error(`Similarity search failed: ${error.message}`);
    }
  }

  /**
   * Recherche avec scores
   */
  async similaritySearchWithScore(query: string, k: number = 4): Promise<[Document, number][]> {
    try {
      const store = await this.initializeVectorStore();
      
      const results = await store.similaritySearchWithScore(query, k);
      
      this.logger.debug(`Found ${results.length} documents with scores`);
      return results;
    } catch (error) {
      this.logger.error('Similarity search with score error:', error);
      throw new Error(`Similarity search with score failed: ${error.message}`);
    }
  }

  /**
   * Supprimer des documents
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      const store = await this.initializeVectorStore();
      
      await store.delete({ ids });
      
      this.logger.log(`Deleted ${ids.length} documents from ChromaDB`);
    } catch (error) {
      this.logger.error('Delete documents error:', error);
      throw new Error(`Failed to delete documents: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un document existant
   */
  async updateDocument(
    id: string,
    content?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Récupérer le document existant
      const existingDoc = await this.getDocumentById(id);
      if (!existingDoc) {
        this.logger.warn(`Document ${id} not found for update`);
        return false;
      }

      // Préparer les nouvelles données
      const newContent = content !== undefined ? content : existingDoc.content;
      const newMetadata = metadata !== undefined 
        ? { ...existingDoc.metadata, ...metadata }
        : existingDoc.metadata;

      // ChromaDB nécessite de régénérer l'embedding si le contenu change
      if (content !== undefined) {
        // Supprimer l'ancien document
        await this.vectorStore.delete({ ids: [id] });
        
        // Ré-ajouter avec le nouveau contenu et le même ID
        const embeddingResult = await this.embeddingsService.embedDocuments([newContent]);
        
        if (!this.collection) {
          this.collection = await this.chromaClient.getCollection({ name: this.collectionName });
        }

        await this.collection.add({
          ids: [id],
          documents: [newContent],
          metadatas: [newMetadata],
          embeddings: embeddingResult.embeddings,
        });

        this.logger.log(`Updated document ${id} with new content and embeddings`);
      } else {
        // Mise à jour uniquement des métadonnées (pas besoin de recalculer les embeddings)
        if (!this.collection) {
          this.collection = await this.chromaClient.getCollection({ name: this.collectionName });
        }

        await this.collection.update({
          ids: [id],
          metadatas: [newMetadata],
        });

        this.logger.log(`Updated metadata for document ${id}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Update document error for ${id}:`, error);
      return false;
    }
  }

  /**
   * Obtenir le nombre de documents via le client ChromaDB natif
   */
  async getDocumentCount(): Promise<number> {
    try {
      // Utiliser le client natif ChromaDB pour accéder à count()
      if (!this.collection) {
        try {
          this.collection = await this.chromaClient.getCollection({ name: this.collectionName });
        } catch (e) {
          this.logger.warn(`Collection ${this.collectionName} not found`);
          return 0;
        }
      }

      const count = await this.collection.count();
      this.logger.debug(`ChromaDB collection ${this.collectionName} contains ${count} documents`);
      return count;
    } catch (error) {
      this.logger.error('Get document count error:', error);
      return 0;
    }
  }

  /**
   * Récupérer tous les documents avec leurs IDs via le client natif
   */
  async getAllDocuments(
    limit: number = 100,
    offset: number = 0
  ): Promise<Array<{ id: string; content: string; metadata: Record<string, any> }>> {
    try {
      if (!this.collection) {
        try {
          this.collection = await this.chromaClient.getCollection({ name: this.collectionName });
        } catch (e) {
          this.logger.warn(`Collection ${this.collectionName} not found`);
          return [];
        }
      }

      // Récupérer les documents avec le client natif
      const results = await this.collection.get({
        limit,
        offset,
        include: ['documents', 'metadatas'],
      });

      // Formater les résultats
      const documents: Array<{ id: string; content: string; metadata: Record<string, any> }> = [];
      for (let i = 0; i < results.ids.length; i++) {
        documents.push({
          id: results.ids[i],
          content: results.documents[i] as string,
          metadata: (results.metadatas[i] as Record<string, any>) || {},
        });
      }

      this.logger.debug(`Retrieved ${documents.length} documents from ChromaDB`);
      return documents;
    } catch (error) {
      this.logger.error('Get all documents error:', error);
      return [];
    }
  }

  /**
   * Récupérer un document par son ID via le client natif
   */
  async getDocumentById(id: string): Promise<{
    id: string;
    content: string;
    metadata: Record<string, any>;
  } | null> {
    try {
      if (!this.collection) {
        try {
          this.collection = await this.chromaClient.getCollection({ name: this.collectionName });
        } catch (e) {
          this.logger.warn(`Collection ${this.collectionName} not found`);
          return null;
        }
      }

      const result = await this.collection.get({
        ids: [id],
        include: ['documents', 'metadatas']
      });

      if (!result.ids || result.ids.length === 0) {
        return null;
      }

      return {
        id: result.ids[0],
        content: result.documents[0] as string,
        metadata: result.metadatas[0] as Record<string, any>,
      };
    } catch (error) {
      this.logger.error('Get document by ID error:', error);
      return null;
    }
  }

  /**
   * Health check - Vérifie simplement la connexion TCP
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Essayer de se connecter à ChromaDB (même si 404, ça prouve que le serveur répond)
      const response = await fetch(`${this.url}/`);
      // Accepter 404 comme succès car ça signifie que le serveur répond
      return response.status === 404 || response.ok;
    } catch (error) {
      this.logger.error('ChromaDB health check failed:', error);
      return false;
    }
  }
}
