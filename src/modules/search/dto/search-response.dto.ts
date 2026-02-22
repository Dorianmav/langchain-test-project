import { ApiProperty } from '@nestjs/swagger';
import type { SearchResult, SearchMetadata } from '../interfaces';

/**
 * DTO pour la réponse de recherche web
 */
export class WebSearchResponseDto {
  @ApiProperty({
    description: 'Résultats de la recherche',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Titre de la page' },
        url: { type: 'string', description: 'URL de la ressource' },
        snippet: { type: 'string', description: 'Extrait de contenu' },
        score: { type: 'number', description: 'Score de pertinence (0-1)', nullable: true },
        metadata: {
          type: 'object',
          description: 'Métadonnées additionnelles',
          nullable: true,
        },
      },
    },
  })
  results: SearchResult[];

  @ApiProperty({
    description: 'Métadonnées de la recherche',
    type: 'object',
    properties: {
      provider: { type: 'string', description: 'Provider utilisé' },
      complexity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Complexité détectée' },
      duration: { type: 'number', description: 'Durée en ms' },
      cached: { type: 'boolean', description: 'Résultat du cache' },
      quotaRemaining: { type: 'number', description: 'Quota restant (Tavily)', nullable: true },
      fallbackReason: { type: 'string', description: 'Raison du fallback', nullable: true },
      timestamp: { type: 'string', description: 'Timestamp ISO' },
    },
  })
  metadata: SearchMetadata;

  @ApiProperty({
    description: 'Requête originale',
    example: 'What is NestJS?',
  })
  query: string;

  @ApiProperty({
    description: 'Nombre total de résultats retournés',
    example: 5,
  })
  totalResults: number;
}
