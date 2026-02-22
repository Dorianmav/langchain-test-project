import { ApiProperty } from '@nestjs/swagger';

/**
 * Document source retourné par Retrieval QA
 */
export class SourceDocumentDto {
  @ApiProperty({
    description: 'Contenu du document',
    example: 'Redis is an in-memory data structure store...',
  })
  content: string;

  @ApiProperty({
    description: 'Métadonnées du document',
    example: { source: 'redis-docs.pdf', page: 1 },
  })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Score de similarité',
    example: 0.87,
  })
  score: number;
}
