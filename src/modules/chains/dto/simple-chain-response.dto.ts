import { ApiProperty } from '@nestjs/swagger';

/**
 * Réponse d'une Simple Chain
 */
export class SimpleChainResponseDto {
  @ApiProperty({
    description: 'Résultat généré par le LLM',
    example: "L'intelligence artificielle est une technologie révolutionnaire...",
  })
  result: string;

  @ApiProperty({
    description: 'Métadonnées d\'exécution',
    example: {
      model: 'llama3.2',
      duration: 1234,
      cached: false,
      provider: 'ollama',
    },
  })
  metadata: {
    model: string;
    duration: number;
    cached: boolean;
    provider: string;
  };
}
