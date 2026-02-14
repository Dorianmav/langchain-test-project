import { IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour l'upload d'un document
 * Utilisé avec Multer pour gérer les fichiers uploadés
 */
export class UploadDocumentDto {
  @ApiProperty({ 
    type: 'string',
    format: 'binary',
    description: 'Fichier à uploader (PDF, TXT, MD, JSON, CSV)',
    example: 'document.pdf'
  })
  file: Express.Multer.File;

  @ApiProperty({ 
    description: 'Métadonnées personnalisées du document (catégorie, auteur, tags, etc.)',
    example: { category: 'documentation', author: 'John Doe', tags: ['technical', 'api'] },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
