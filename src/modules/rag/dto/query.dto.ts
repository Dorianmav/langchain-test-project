import { IsString, IsOptional, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour les requêtes RAG
 */
export class QueryDto {
  @ApiProperty({
    description: 'Question à poser au système RAG',
    example: 'Comment configurer le système d\'authentification JWT ?',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Nombre de documents à récupérer',
    example: 4,
    default: 4,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiProperty({
    description: 'Score de similarité minimum (0-1)',
    example: 0.7,
    default: 0.7,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number;

  @ApiProperty({
    description: 'Température du LLM (0 = précis, 1 = créatif)',
    example: 0.7,
    default: 0.7,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiProperty({
    description: 'Filtre sur les métadonnées des documents',
    example: { category: 'documentation' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  filter?: Record<string, any>;

  @ApiProperty({
    description: 'Inclure les documents sources dans la réponse',
    example: true,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSourceDocuments?: boolean;

  @ApiProperty({
    description: 'Inclure des exemples few-shot dans le prompt',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeFewShot?: boolean;

  @ApiProperty({
    description: 'Utiliser le prompt RAG avancé avec métadonnées',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  useAdvancedPrompt?: boolean;
}
