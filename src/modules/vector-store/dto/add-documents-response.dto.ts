import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de réponse pour l'ajout de documents
 */
export class AddDocumentsResponseDto {
  @ApiProperty({ example: ['doc_123', 'doc_456'] })
  ids: string[];

  @ApiProperty({ example: 2 })
  count: number;

  @ApiProperty({ example: 'Documents added successfully' })
  message: string;

  @ApiProperty({ example: { provider: 'chroma', collection: 'rag_documents' } })
  metadata: {
    provider: string;
    collection: string;
    embeddingsModel: string;
  };
}
