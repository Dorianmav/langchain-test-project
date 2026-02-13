import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { DocumentLoaderService } from '../document-loader/document-loader.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { LLMService } from '../llm/llm.service';
import { RAGResult, RAGPipelineConfig } from './interfaces/rag-pipeline.interface';
import { IngestDocumentDto, QueryDto, IngestResponseDto, RAGResponseDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service orchestrant le pipeline RAG complet
 * Ingestion : Documents → Chunks → Embeddings → VectorStore
 * Query : Question → Retrieval → Context + LLM → Answer
 */
@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly documentLoader: DocumentLoaderService,
    private readonly embeddings: EmbeddingsService,
    private readonly vectorStore: VectorStoreService,
    private readonly llm: LLMService,
  ) {}

  /**
   * PHASE 1: INGESTION - Charge un document et l'indexe dans le vector store
   */
  async ingestDocument(dto: IngestDocumentDto): Promise<IngestResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🚀 Starting document ingestion: ${dto.filePath}`);

    try {
      // 1. Charger et découper le document en chunks
      this.logger.log('📄 Step 1/3: Loading and splitting document...');
      const chunks = await this.documentLoader.loadAndSplit(
        dto.filePath,
        {
          chunkSize: dto.chunkSize || 1000,
          chunkOverlap: dto.chunkOverlap || 200,
        },
        dto.metadata
      );

      this.logger.log(`✂️  Created ${chunks.length} chunks`);

      // 2. Générer les embeddings pour chaque chunk
      this.logger.log('🧠 Step 2/3: Generating embeddings...');
      const texts = chunks.map((chunk) => chunk.pageContent);
      const { embeddings } = await this.embeddings.embedDocuments(texts);

      this.logger.log(`✅ Generated ${embeddings.length} embeddings`);

      // 3. Insérer dans le vector store
      this.logger.log('💾 Step 3/3: Storing in vector database...');
      const documentId = `doc_${uuidv4()}`;
      
      const result = await this.vectorStore.addDocuments(chunks.map((chunk, index) => ({
        content: chunk.pageContent,
        metadata: {
          ...chunk.metadata,
          documentId,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      })));

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Ingestion complete: ${chunks.length} chunks indexed in ${processingTime}ms`
      );

      return {
        documentId,
        chunksCreated: chunks.length,
        vectorIds: result.ids,
        processingTime,
        metadata: dto.metadata || {},
      };
    } catch (error) {
      this.logger.error(`❌ Ingestion failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * PHASE 2: RETRIEVAL - Recherche les documents similaires
   */
  private async retrieveRelevantDocuments(
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

  /**
   * PHASE 3: GENERATION - Génère une réponse avec le LLM
   */
  private async generateAnswer(
    query: string,
    context: Document[],
    temperature: number = 0.7
  ): Promise<{ answer: string; tokensUsed?: number }> {
    this.logger.log('🤖 Generating answer with LLM...');

    // Construire le contexte à partir des documents
    const contextText = context
      .map((doc, index) => `[Document ${index + 1}]\n${doc.pageContent}`)
      .join('\n\n---\n\n');

    // Prompt RAG
    const prompt = `Tu es un assistant IA qui répond aux questions en te basant UNIQUEMENT sur le contexte fourni.

Contexte:
${contextText}

Question: ${query}

Instructions:
- Réponds de manière précise et concise
- Base-toi UNIQUEMENT sur les informations du contexte
- Si la réponse n'est pas dans le contexte, dis "Je ne trouve pas cette information dans les documents fournis"
- Cite les sources si possible

Réponse:`;

    // Générer la réponse
    const { response } = await this.llm.generate(prompt, { temperature });

    this.logger.log('✅ Answer generated successfully');

    return {
      answer: response,
      tokensUsed: undefined, // LLM service doesn't return token count yet
    };
  }

  /**
   * PIPELINE RAG COMPLET - Query → Retrieve → Generate
   */
  async query(dto: QueryDto): Promise<RAGResponseDto> {
    const totalStartTime = Date.now();
    this.logger.log(`\n🎯 RAG Query: "${dto.query}"`);

    try {
      // Phase 1: Retrieval
      const retrievalStartTime = Date.now();
      const { documents, scores } = await this.retrieveRelevantDocuments(
        dto.query,
        dto.topK || 4,
        dto.filter
      );
      const retrievalTime = Date.now() - retrievalStartTime;

      // Phase 2: Generation
      const generationStartTime = Date.now();
      const { answer, tokensUsed } = await this.generateAnswer(
        dto.query,
        documents,
        dto.temperature || 0.7
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
