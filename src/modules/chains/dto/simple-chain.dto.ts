import { IsString, IsOptional, IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour Simple Chain (LLMChain)
 * Chaîne basique : prompt unique + variables optionnelles
 */
export class SimpleChainDto {
  @ApiProperty({
    description: 'Template de prompt avec variables {var}',
    example: 'Écris une courte description de {topic} en {language}',
  })
  @IsString()
  template: string;

  @ApiPropertyOptional({
    description: 'Variables pour le template',
    example: { topic: 'intelligence artificielle', language: 'français' },
  })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Température du modèle (0-1)',
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Nombre maximum de tokens',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number;

  @ApiPropertyOptional({
    description: 'Modèle LLM à utiliser',
    example: 'llama3.2',
  })
  @IsOptional()
  @IsString()
  model?: string;
}
