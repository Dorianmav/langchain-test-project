import { IsString, IsOptional,  IsObject, IsNotEmpty, MaxLength } from 'class-validator';
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