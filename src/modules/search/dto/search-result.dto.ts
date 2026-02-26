import { ApiProperty } from '@nestjs/swagger';

export class SearchResultDto {
  @ApiProperty({ description: 'Titre de la page', example: 'NestJS - A progressive Node.js framework' })
  title: string;

  @ApiProperty({ description: 'URL de la ressource', example: 'https://nestjs.com' })
  url: string;

  @ApiProperty({ description: 'Extrait de contenu', example: 'NestJS is a framework for building...' })
  snippet: string;

  @ApiProperty({ description: 'Score de pertinence (0-1)', example: 0.95, nullable: true, required: false })
  score?: number;

  @ApiProperty({
    description: 'Métadonnées additionnelles',
    example: { source: 'tavily' },
    nullable: true,
    required: false,
  })
  metadata?: Record<string, unknown>;
}

export class SearchMetadataDto {
  @ApiProperty({ description: 'Provider utilisé', example: 'tavily' })
  provider: string;

  @ApiProperty({ description: 'Complexité détectée', enum: ['low', 'medium', 'high'], example: 'medium' })
  complexity: string;

  @ApiProperty({ description: 'Durée de la requête en ms', example: 342 })
  duration: number;

  @ApiProperty({ description: 'Résultat servi depuis le cache', example: false })
  cached: boolean;

  @ApiProperty({ description: 'Quota Tavily restant', example: 753, nullable: true, required: false })
  quotaRemaining?: number;

  @ApiProperty({ description: 'Raison du fallback vers SearXNG', nullable: true, required: false })
  fallbackReason?: string;

  @ApiProperty({ description: 'Timestamp ISO de la réponse', example: '2026-02-26T19:00:00.000Z' })
  timestamp: string;
}
