import { IsString, IsArray, IsOptional, IsNumber, Min, Max, ValidateNested, IsObject, IsNotEmpty, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour un document à indexer
 */
export class DocumentDto {
  @ApiProperty({ 
    description: 'Contenu textuel du document',
    example: 'La photosynthèse est un processus biologique qui permet aux plantes de produire de l\'énergie.'
  })
  @IsString()
  @IsNotEmpty({ message: 'Le contenu du document est requis' })
  @MaxLength(50000, { message: 'Le contenu ne peut pas dépasser 50000 caractères' })
  content: string;

  @ApiProperty({ 
    description: 'Métadonnées du document',
    example: { source: 'wikipedia', category: 'biologie', author: 'John Doe' },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO de réponse pour un document trouvé dans le vector store
 */
export class VectorStoreDocumentDto {
  @ApiProperty({ example: 'doc_123' })
  id?: string;

  @ApiProperty({ example: 'Paris est la capitale de la France' })
  content: string;

  @ApiProperty({ example: { source: 'wikipedia', category: 'géographie' } })
  metadata: Record<string, any>;

  @ApiProperty({ example: 0.92, required: false })
  score?: number;
}