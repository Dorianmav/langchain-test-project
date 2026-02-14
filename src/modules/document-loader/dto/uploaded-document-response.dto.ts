import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de réponse après upload et traitement d'un document
 */
export class UploadedDocumentResponseDto {
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
