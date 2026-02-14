import { ApiProperty } from '@nestjs/swagger';
import { VectorStoreDocumentDto } from './vector-store-document.dto';

/**
 * DTO de réponse pour la recherche
 */
export class SearchResponseDto {
  @ApiProperty({ type: [VectorStoreDocumentDto] })
  documents: VectorStoreDocumentDto[];

  @ApiProperty({ example: 'Quelle est la capitale de la France ?' })
  query: string;

  @ApiProperty({ example: 4 })
  resultsCount: number;

  @ApiProperty({ example: { provider: 'chroma', collection: 'rag_documents', embeddingsModel: 'nomic-embed-text' } })
  metadata: {
    provider: string;
    collection: string;
    embeddingsModel: string;
    searchDuration?: number;
  };
}
