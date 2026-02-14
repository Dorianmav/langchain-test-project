import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de réponse pour une mise à jour de document
 */
export class UpdateDocumentResponseDto {
  @ApiProperty({ example: 'doc_123' })
  id: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Document updated successfully' })
  message: string;

  @ApiProperty({ 
    example: { 
      contentUpdated: true, 
      metadataUpdated: false 
    } 
  })
  changes: {
    contentUpdated: boolean;
    metadataUpdated: boolean;
  };
}
