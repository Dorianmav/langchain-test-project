import { Injectable, Logger } from '@nestjs/common';
import { RagIngestionService } from './services/rag-ingestion.service';
import { RagRetrievalService } from './services/rag-retrieval.service';
import { RagGenerationService } from './services/rag-generation.service';
import { IngestDocumentDto, QueryDto, IngestResponseDto, RAGResponseDto } from './dto';

/**
 * Service orchestrant le pipeline RAG complet
 * Délègue à des services spécialisés pour chaque phase
 * Ingestion : Documents → Chunks → Embeddings → VectorStore
 * Query : Question → Retrieval → Context + LLM → Answer
 */
@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly ingestionService: RagIngestionService,
    private readonly retrievalService: RagRetrievalService,
    private readonly generationService: RagGenerationService,
  ) {}

  /**
   * PHASE 1: INGESTION - Délègue au service d'ingestion
   */
  async ingestDocument(dto: IngestDocumentDto): Promise<IngestResponseDto> {
    return this.ingestionService.ingestDocument(dto);
  }

  /**
   * PIPELINE RAG COMPLET - Orchestre les 3 phases
   * Query → Retrieve → Generate
   */
  async query(dto: QueryDto): Promise<RAGResponseDto> {
    const totalStartTime = Date.now();
    this.logger.log(`\n🎯 RAG Query: "${dto.query}"`);
    this.logger.log(`⚙️  Options: few-shot=${dto.includeFewShot || false}, advanced=${dto.useAdvancedPrompt || false}`);

    try {
      // Phase 1: Retrieval (délégué au service de retrieval)
      const retrievalStartTime = Date.now();
      const { documents, scores } = await this.retrievalService.retrieveRelevantDocuments(
        dto.query,
        dto.topK || 4,
        dto.filter
      );
      const retrievalTime = Date.now() - retrievalStartTime;

      // Phase 2: Generation (délégué au service de génération)
      const generationStartTime = Date.now();
      const { answer, tokensUsed } = await this.generationService.generateAnswer(
        dto.query,
        documents,
        dto.temperature || 0.7,
        dto.includeFewShot || false,
        dto.useAdvancedPrompt || false,
      );
      const generationTime = Date.now() - generationStartTime;

      const totalTime = Date.now() - totalStartTime;

      // Construire la réponse
      const response: RAGResponseDto = {
        query: dto.query,
        answer,
        sources: documents.map((doc, index) => ({
          content: doc.pageContent.substring(0, 200) + '...', // Tronquer pour la réponse
          metadata: doc.metadata,
          score: scores[index],
        })),
        stats: {
          retrievalTime,
          generationTime,
          totalTime,
          documentsRetrieved: documents.length,
          tokensUsed,
        },
      };

      this.logger.log(
        `✅ RAG completed in ${totalTime}ms (retrieval: ${retrievalTime}ms, generation: ${generationTime}ms)`
      );

      return response;
    } catch (error) {
      this.logger.error(`❌ RAG query failed: ${error.message}`);
      throw error;
    }
  }
}
