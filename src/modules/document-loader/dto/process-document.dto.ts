import { IsString, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour le traitement (chunking) d'un document
 */
export class ProcessDocumentDto {
  @ApiProperty({ 
    description: 'Chemin du fichier à traiter',
    example: '/uploads/document.pdf'
  })
  @IsString()
  filePath: string;

  @ApiProperty({ 
    description: 'Taille maximale des chunks en caractères',
    example: 1000,
    default: 1000,
    required: false,
    minimum: 100,
    maximum: 5000
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  chunkSize?: number;

  @ApiProperty({ 
    description: 'Nombre de caractères qui se chevauchent entre chunks',
    example: 200,
    default: 200,
    required: false,
    minimum: 0,
    maximum: 1000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  chunkOverlap?: number;

  @ApiProperty({ 
    description: 'Métadonnées personnalisées à ajouter au document',
    example: { category: 'technical', priority: 'high' },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
