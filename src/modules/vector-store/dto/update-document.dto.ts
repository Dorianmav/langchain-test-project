import { IsString, IsOptional, IsObject, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour mettre à jour un document existant
 */
export class UpdateDocumentDto {
  @ApiProperty({ 
    description: 'Nouveau contenu du document',
    example: 'Paris est la capitale de la France, située sur la Seine.',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Le contenu ne peut pas être vide' })
  @MaxLength(50000, { message: 'Le contenu ne peut pas dépasser 50000 caractères' })
  content?: string;

  @ApiProperty({ 
    description: 'Nouvelles métadonnées du document (remplace les anciennes)',
    example: { source: 'wikipedia', category: 'géographie', updated: true },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
