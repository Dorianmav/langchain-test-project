import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceDocumentDto } from './source-document.dto';

/**
 * Réponse Conversational Retrieval Chain
 */
export class ConversationalRetrievalResponseDto {
  @ApiProperty({
    description: 'Réponse générée avec contexte conversationnel',
    example: 'Pour configurer Redis avec TLS, vous devez...',
  })
  answer: string;

  @ApiPropertyOptional({
    description: 'Documents sources utilisés',
    type: [SourceDocumentDto],
  })
  sourceDocuments?: SourceDocumentDto[];

  @ApiProperty({
    description: 'Question reformulée (standalone question)',
    example: 'Comment configurer Redis avec TLS ?',
  })
  standaloneQuestion: string;

  @ApiProperty({
    description: 'Métadonnées d\'exécution',
    example: {
      sessionId: 'user-123-session-abc',
      messagesInMemory: 4,
      documentsRetrieved: 4,
      duration: 1789,
      cached: false,
    },
  })
  metadata: {
    sessionId: string;
    messagesInMemory: number;
    documentsRetrieved: number;
    duration: number;
    cached: boolean;
  };
}
