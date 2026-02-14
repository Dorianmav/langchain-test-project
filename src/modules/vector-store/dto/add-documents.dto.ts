import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentDto } from './document.dto';

/**
 * DTO pour ajouter plusieurs documents
 */
export class AddDocumentsDto {
  @ApiProperty({ 
    description: 'Liste de documents à indexer',
    type: [DocumentDto],
    example: [
      { 
        content: 'Paris est la capitale de la France',
        metadata: { source: 'manuel', category: 'géographie' }
      },
      { 
        content: 'La Tour Eiffel mesure 330 mètres',
        metadata: { source: 'wikipedia', category: 'monuments' }
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentDto)
  documents: DocumentDto[];
}