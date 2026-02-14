import { IsString, IsOptional, IsNumber, Min, Max, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    type: 'array',
    items: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        metadata: { type: 'object' },
        score: { type: 'number' },
      },
    },
  })
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    score: number;
  }>;

  @ApiProperty({
    description: 'Statistiques de performance',
  })
  stats: {
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
    documentsRetrieved: number;
    tokensUsed?: number;
  };
}
