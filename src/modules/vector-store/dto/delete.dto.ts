import { IsString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour supprimer des documents
 */
export class DeleteDocumentsDto {
  @ApiProperty({ 
    description: 'IDs des documents a supprimer',
    example: ['doc_123', 'doc_456', 'doc_789']
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}