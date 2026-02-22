import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChainType } from './chain-type.enum';

/**
 * DTO pour Retrieval QA Chain
 * Chaîne question-réponse avec récupération de documents du vector store
 */
export class RetrievalQADto {
  @ApiProperty({
    description: 'Question à poser sur les documents',
    example: 'Quelles sont les fonctionnalités principales de Redis ?',
  })
  @IsString()
  question: string;

  @ApiPropertyOptional({
    description: 'Nombre de documents à récupérer',
    example: 4,
    default: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({
    description: 'Type de chaîne à utiliser',
    enum: ChainType,
    example: ChainType.STUFF,
    default: ChainType.STUFF,
  })
  @IsOptional()
  @IsEnum(ChainType)
  chainType?: ChainType;

  @ApiPropertyOptional({
    description: 'Retourner les documents sources avec la réponse',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  returnSourceDocuments?: boolean;

  @ApiPropertyOptional({
    description: 'Type de vector store (qdrant ou chroma)',
    example: 'qdrant',
  })
  @IsOptional()
  @IsString()
  vectorStoreType?: 'qdrant' | 'chroma';

  @ApiPropertyOptional({
    description: 'Nom de la collection',
    example: 'documents',
  })
  @IsOptional()
  @IsString()
  collectionName?: string;

  @ApiPropertyOptional({
    description: 'Température du modèle',
    example: 0.3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Modèle LLM à utiliser',
    example: 'llama3.2',
  })
  @IsOptional()
  @IsString()
  model?: string;
}
