import { IsString, IsOptional, IsObject, IsNumber, Min, Max } from 'class-validator';
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

/**
 * DTO de réponse après traitement d'un document
 */
export class DocumentResponseDto {
  @ApiProperty({ 
    description: 'ID unique du document',
    example: 'doc_a1b2c3d4e5f6' 
  })
  id: string;

  @ApiProperty({ 
    description: 'Nom du fichier uploadé',
    example: 'technical-documentation.pdf' 
  })
  fileName: string;

  @ApiProperty({ 
    description: 'Type de fichier',
    example: 'pdf' 
  })
  fileType: string;

  @ApiProperty({ 
    description: 'Taille du fichier en bytes',
    example: 1024000 
  })
  fileSize: number;

  @ApiProperty({ 
    description: 'Nombre de chunks générés',
    example: 15 
  })
  chunksCount: number;

  @ApiProperty({ 
    description: 'IDs des chunks créés dans le vector store',
    example: ['chunk_1a2b', 'chunk_3c4d', 'chunk_5e6f'],
    type: [String]
  })
  chunkIds: string[];

  @ApiProperty({ 
    description: 'Métadonnées du document',
    example: { category: 'docs', author: 'System' }
  })
  metadata: Record<string, any>;

  @ApiProperty({ 
    description: 'Date et heure d\'upload',
    example: '2024-02-13T10:30:00.000Z' 
  })
  uploadedAt: Date;
}
