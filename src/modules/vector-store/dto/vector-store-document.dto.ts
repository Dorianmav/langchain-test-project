import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de réponse pour un document trouvé dans le vector store
 */
export class VectorStoreDocumentDto {
  @ApiProperty({ example: 'doc_123' })
  id?: string;

  @ApiProperty({ example: 'Paris est la capitale de la France' })
  content: string;

  @ApiProperty({ example: { source: 'wikipedia', category: 'géographie' } })
  metadata: Record<string, any>;

  @ApiProperty({ example: 0.92, required: false })
  score?: number;
}
