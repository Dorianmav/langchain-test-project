import { IsString, IsOptional, IsNumber, Min, Max, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VectorStoreDocumentDto } from './document.dto';

/**
 * DTO pour la recherche de similarité
 */
export class SearchDto {
  @ApiProperty({ 
    description: 'Requête de recherche',
    example: 'Quelle est la capitale de la France ?'
  })
  @IsString()
  query: string;

  @ApiProperty({ 
    description: 'Nombre de résultats à retourner',
    example: 4,
    minimum: 1,
    maximum: 50,
    default: 4,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  k?: number = 4;

  @ApiProperty({ 
    description: 'Filtres sur les métadonnées',
    example: { category: 'géographie' },
    required: false
  })
  @IsOptional()
  @IsObject()
  filter?: Record<string, any>;

  @ApiProperty({ 
    description: 'Inclure les scores de similarité dans la réponse',
    example: true,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  includeScores?: boolean = false;
}

/**
 * DTO de réponse pour la recherche
 */
export class SearchResponseDto {
  @ApiProperty({ type: [VectorStoreDocumentDto] })
  documents: VectorStoreDocumentDto[];

  @ApiProperty({ example: 'Quelle est la capitale de la France ?' })
  query: string;

  @ApiProperty({ example: 4 })
  resultsCount: number;

  @ApiProperty({ example: { provider: 'chroma', collection: 'rag_documents', embeddingsModel: 'nomic-embed-text' } })
  metadata: {
    provider: string;
    collection: string;
    embeddingsModel: string;
    searchDuration?: number;
  };
}
