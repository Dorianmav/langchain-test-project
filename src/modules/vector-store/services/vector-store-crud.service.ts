import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IVectorStoreProvider } from '../interfaces/vector-store-provider.interface';

/**
 * Service responsable des opérations CRUD sur les documents
 */
@Injectable()
export class VectorStoreCrudService {
  private readonly logger = new Logger(VectorStoreCrudService.name);

  /**
   * Ajouter des documents au vector store
   */
  async addDocuments(
    provider: IVectorStoreProvider,
    providerName: string,
    documents: Array<{ content: string; metadata?: Record<string, any> }>
  ): Promise<{ ids: string[]; count: number }> {
    try {
      // Convertir en format LangChain Document
      const langchainDocs = documents.map(doc => new Document({
        pageContent: doc.content,
        metadata: doc.metadata || {},
      }));

      const ids = await provider.addDocuments(langchainDocs);

      this.logger.log(`✅ Added ${ids.length} documents to ${providerName}`);

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
   * Supprimer des documents
   */
  async deleteDocuments(
    provider: IVectorStoreProvider,
    providerName: string,
    ids: string[]
  ): Promise<{ deleted: number; message: string }> {
    try {
      await provider.deleteDocuments(ids);

      this.logger.log(`✅ Deleted ${ids.length} documents from ${providerName}`);

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
    provider: IVectorStoreProvider,
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
      const success = await provider.updateDocument(id, content, metadata);

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
   * Récupérer tous les documents avec leurs IDs
   */
  async getAllDocuments(
    provider: IVectorStoreProvider,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    documents: Array<{ id: string; content: string; metadata: Record<string, any> }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const documents = await provider.getAllDocuments(limit, offset);
      const totalCount = await provider.getDocumentCount();

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
   * Obtenir un document par son ID
   */
  async getDocumentById(
    provider: IVectorStoreProvider,
    id: string
  ) {
    try {
      const document = await provider.getDocumentById(id);
      
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
