import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { VectorStoreService } from '../../vector-store/vector-store.service';

/**
 * Service responsable de la récupération de documents pertinents
 * Effectue des recherches de similarité dans le vector store
 */
@Injectable()
export class RagRetrievalService {
  private readonly logger = new Logger(RagRetrievalService.name);

  constructor(
    private readonly vectorStore: VectorStoreService,
  ) {}

  /**
   * Recherche les documents similaires à la requête
   */
  async retrieveRelevantDocuments(
    query: string,
    topK: number = 4,
    filter?: Record<string, any>
  ): Promise<{ documents: Document[]; scores: number[] }> {
    this.logger.log(`🔍 Searching for relevant documents (topK=${topK})...`);

    // Rechercher dans le vector store (similarySearch génère l'embedding automatiquement)
    const result = await this.vectorStore.similaritySearch(query, topK, filter, true);

    this.logger.log(`📚 Found ${result.documents.length} relevant documents`);

    return {
      documents: result.documents.map((doc) => new Document({
        pageContent: doc.content,
        metadata: doc.metadata,
      })),
      scores: result.documents.map((doc) => doc.score || 0),
    };
  }
}
