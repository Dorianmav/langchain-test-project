import { Injectable, Logger } from '@nestjs/common';
import { DocumentLoaderService } from '../../document-loader/document-loader.service';
import { VectorStoreService } from '../../vector-store/vector-store.service';
import { IngestDocumentDto, IngestResponseDto } from '../dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service responsable de l'ingestion de documents
 * Charge, découpe et indexe les documents dans le vector store
 */
@Injectable()
export class RagIngestionService {
  private readonly logger = new Logger(RagIngestionService.name);

  constructor(
    private readonly documentLoader: DocumentLoaderService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  /**
   * Charge un document et l'indexe dans le vector store
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

      // 2. Insérer dans le vector store
      this.logger.log('💾 Step 2/3: Storing in vector database...');
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
}
