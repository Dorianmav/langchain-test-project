import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromptType } from './prompt-enums.dto';

/**
 * Réponse de validation de prompt
 */
export class PromptValidationResponse {
  @ApiProperty({
    description: 'Le prompt est valide',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Variables manquantes',
    example: [],
    type: [String],
  })
  missingVariables: string[];

  @ApiPropertyOptional({
    description: 'Message d\'erreur si invalide',
  })
  error?: string;
}

/**
 * Réponse de création de prompt
 */
export class CreatePromptResponse {
  @ApiProperty({
    description: 'Prompt formaté et prêt à utiliser',
    example: 'Tu es un assistant IA...',
  })
  prompt: string;

  @ApiProperty({
    description: 'Type de prompt créé',
    enum: PromptType,
  })
  type: PromptType;

  @ApiProperty({
    description: 'Exemples few-shot inclus',
    example: true,
  })
  includedFewShot: boolean;

  @ApiPropertyOptional({
    description: 'Nombre d\'exemples inclus',
  })
  exampleCount?: number;

  @ApiProperty({
    description: 'Variables détectées dans le template',
    example: ['context', 'question'],
    type: [String],
  })
  variables: string[];
}
