import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { IngestDocumentDto, QueryDto, IngestResponseDto, RAGResponseDto } from './dto';

/**
 * Controller pour les opérations RAG (Retrieval-Augmented Generation)
 */
@ApiTags('RAG')
@Controller('rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);

  constructor(private readonly ragService: RagService) {}

  /**
   * Ingère un document dans le système RAG
   * Documents → Chunks → Embeddings → Vector Store
   */
  @Post('ingest')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Ingest a document into the RAG system',
    description: 'Loads a document, splits it into chunks, generates embeddings, and stores them in the vector database'
  })
  @ApiResponse({
    status: 201,
    description: 'Document ingested successfully',
    type: IngestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file path or configuration',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal error during ingestion',
  })
  async ingestDocument(@Body() dto: IngestDocumentDto): Promise<IngestResponseDto> {
    this.logger.log(`📥 Ingesting document: ${dto.filePath}`);
    return this.ragService.ingestDocument(dto);
  }

  /**
   * Pose une question au système RAG
   * Query → Retrieval → Context + LLM → Answer
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query the RAG system',
    description: 'Retrieves relevant documents and generates an answer using the LLM with context'
  })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    type: RAGResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal error during query processing',
  })
  async query(@Body() dto: QueryDto): Promise<RAGResponseDto> {
    this.logger.log(`💬 RAG Query: "${dto.query}"`);
    return this.ragService.query(dto);
  }
}
