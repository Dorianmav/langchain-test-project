import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Types de prompts disponibles
 */
export enum PromptType {
  RAG = 'rag',
  CONVERSATION = 'conversation',
  SUMMARIZATION = 'summarization',
  CODE_EXPLANATION = 'code',
  EXTRACTION = 'extraction',
}

/**
 * Catégories d'exemples few-shot
 */
export enum FewShotCategory {
  RAG = 'rag',
  CONVERSATION = 'conversation',
  CODE = 'code',
  SUMMARIZATION = 'summarization',
  EXTRACTION = 'extraction',
}

/**
 * DTO pour la création d'un prompt personnalisé
 */
export class CreatePromptDto {
  @ApiProperty({
    description: 'Type de prompt à créer',
    enum: PromptType,
    example: PromptType.RAG,
  })
  @IsEnum(PromptType)
  type: PromptType;

  @ApiPropertyOptional({
    description: 'Inclure des exemples few-shot',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeFewShot?: boolean = false;

  @ApiPropertyOptional({
    description: "Inclure l'historique de conversation",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  includeHistory?: boolean = false;

  @ApiPropertyOptional({
    description: 'Longueur maximale pour les résumés (en mots)',
    example: 200,
    minimum: 50,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(1000)
  maxLength?: number = 200;

  @ApiPropertyOptional({
    description: 'Variables personnalisées à injecter dans le prompt',
    example: { context: 'Mon contexte', question: 'Ma question' },
  })
  @IsOptional()
  variables?: Record<string, any>;
}

/**
 * DTO pour formater un prompt avec des variables
 */
export class FormatPromptDto {
  @ApiProperty({
    description: 'Template du prompt (avec placeholders {variable})',
    example: 'Réponds à la question: {question}',
  })
  @IsString()
  template: string;

  @ApiProperty({
    description: 'Variables à injecter dans le template',
    example: { question: 'Qu\'est-ce qu\'un RAG ?' },
  })
  variables: Record<string, any>;
}

/**
 * DTO pour valider un prompt
 */
export class ValidatePromptDto {
  @ApiProperty({
    description: 'Template du prompt à valider',
    example: 'Contexte: {context}\nQuestion: {question}',
  })
  @IsString()
  template: string;

  @ApiProperty({
    description: 'Variables requises dans le template',
    example: ['context', 'question'],
  })
  @IsString({ each: true })
  requiredVariables: string[];
}

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
