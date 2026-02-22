import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceDocumentDto } from './source-document.dto';

/**
 * Réponse Retrieval QA Chain
 */
export class RetrievalQAResponseDto {
  @ApiProperty({
    description: 'Réponse générée basée sur les documents',
    example: 'Redis offre plusieurs fonctionnalités principales : stockage en mémoire...',
  })
  answer: string;

  @ApiPropertyOptional({
    description: 'Documents sources utilisés pour la réponse',
    type: [SourceDocumentDto],
  })
  sourceDocuments?: SourceDocumentDto[];

  @ApiProperty({
    description: 'Métadonnées d\'exécution',
    example: {
      documentsRetrieved: 4,
      chainType: 'stuff',
      duration: 1567,
      cached: false,
    },
  })
  metadata: {
    documentsRetrieved: number;
    chainType: string;
    duration: number;
    cached: boolean;
  };
}
