import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour Conversational Retrieval Chain
 * Chaîne avec mémoire conversationnelle + récupération de documents
 */
export class ConversationalRetrievalDto {
  @ApiProperty({
    description: 'ID de session pour la mémoire conversationnelle',
    example: 'user-123-session-abc',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Question de l\'utilisateur',
    example: 'Comment configurer Redis avec TLS ?',
  })
  @IsString()
  question: string;

  @ApiPropertyOptional({
    description: 'Nombre de documents à récupérer',
    example: 4,
    default: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({
    description: 'Retourner les documents sources',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  returnSourceDocuments?: boolean;

  @ApiPropertyOptional({
    description: 'Type de vector store',
    example: 'qdrant',
  })
  @IsOptional()
  @IsString()
  vectorStoreType?: 'qdrant' | 'chroma';

  @ApiPropertyOptional({
    description: 'Nom de la collection',
    example: 'documents',
  })
  @IsOptional()
  @IsString()
  collectionName?: string;

  @ApiPropertyOptional({
    description: 'Température du modèle',
    example: 0.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Modèle LLM à utiliser',
    example: 'llama3.2',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description:
      'Prompt système injecté côté serveur avant la réponse du LLM. ' +
      'Permet de définir le comportement, le ton et les contraintes de réponse. ' +
      'Non exposé dans l\'historique conversationnel.',
    example: 'Réponds toujours en français. Sois concis et précis.',
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;
}
