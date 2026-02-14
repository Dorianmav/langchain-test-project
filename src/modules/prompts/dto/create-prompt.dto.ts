import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromptType } from './prompt-enums.dto';

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
