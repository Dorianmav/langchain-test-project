import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResponseDto {
  @ApiProperty({
    description: 'Chemin du fichier uploadé',
    example: 'uploads/abc123.pdf',
  })
  filePath: string;

  @ApiProperty({
    description: 'Nom original du fichier',
    example: 'document.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'Taille du fichier en octets',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'Extension du fichier',
    example: 'pdf',
  })
  fileType: string;

  @ApiProperty({
    description: 'Métadonnées additionnelles',
    example: { category: 'documentation', author: 'John Doe' },
    required: false,
  })
  metadata?: Record<string, unknown>;
}

export class SupportedTypesResponseDto {
  @ApiProperty({
    description: 'Liste des types de fichiers supportés',
    type: [String],
    example: ['pdf', 'txt', 'md', 'json', 'csv'],
  })
  supportedTypes: string[];
}
