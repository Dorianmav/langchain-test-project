import { ApiProperty } from '@nestjs/swagger';

export class RagSourceDto {
  @ApiProperty({ description: 'Contenu du chunk source', example: 'Pour configurer JWT...' })
  content: string;

  @ApiProperty({ description: 'Métadonnées du document', example: { source: 'jwt-guide.md' } })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Score de similarité (0-1)', example: 0.87 })
  score: number;
}

export class RagStatsDto {
  @ApiProperty({ description: 'Temps de récupération des documents en ms', example: 120 })
  retrievalTime: number;

  @ApiProperty({ description: 'Temps de génération LLM en ms', example: 850 })
  generationTime: number;

  @ApiProperty({ description: 'Temps total en ms', example: 970 })
  totalTime: number;

  @ApiProperty({ description: 'Nombre de documents récupérés', example: 4 })
  documentsRetrieved: number;

  @ApiProperty({ description: 'Tokens utilisés', example: 512, required: false })
  tokensUsed?: number;
}

/**
 * Réponse d'une requête RAG
 */
export class RAGResponseDto {
  @ApiProperty({
    description: 'Question posée',
    example: 'Comment configurer JWT ?',
  })
  query: string;

  @ApiProperty({
    description: 'Réponse générée par le LLM',
    example: 'Pour configurer JWT, vous devez...',
  })
  answer: string;

  @ApiProperty({
    description: 'Documents sources utilisés',
    type: [RagSourceDto],
  })
  sources: RagSourceDto[];

  @ApiProperty({
    description: 'Statistiques de performance',
    type: RagStatsDto,
  })
  stats: RagStatsDto;
}
