import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type ConversationMode = 'chat' | 'rag' | 'agent';

/**
 * DTO pour créer une nouvelle conversation
 */
export class CreateConversationDto {
  @ApiProperty({
    description: 'Titre de la conversation (optionnel, généré auto si absent)',
    example: 'Discussion sur NestJS',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Mode de la conversation : chat (LLM direct), rag (avec documents), agent (avec outils)',
    enum: ['chat', 'rag', 'agent'],
    default: 'chat',
    required: false,
  })
  @IsOptional()
  @IsEnum(['chat', 'rag', 'agent'])
  mode?: ConversationMode;

  @ApiProperty({
    description: 'Activer l\'injection de l\'historique dans le prompt (défaut : true)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  useHistory?: boolean;
}

/**
 * DTO pour renommer une conversation
 */
export class UpdateConversationDto {
  @ApiProperty({
    description: 'Nouveau titre de la conversation',
    example: 'Refactoring du projet',
  })
  @IsString()
  title: string;
}

/**
 * DTO pour envoyer un message dans une conversation
 */
export class SendMessageDto {
  @ApiProperty({
    description: 'Message de l\'utilisateur',
    example: 'Comment implémenter une authentification JWT dans NestJS ?',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Nombre de documents RAG à récupérer (mode rag uniquement)',
    example: 4,
    required: false,
  })
  @IsOptional()
  topK?: number;

  @ApiProperty({
    description: 'Température du LLM (0 = précis, 1 = créatif)',
    example: 0.7,
    required: false,
  })
  @IsOptional()
  temperature?: number;

  @ApiProperty({
    description: 'Surcharger pour ce message le mode historique de la conversation (true/false)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  useHistory?: boolean;

  @ApiProperty({
    description: 'Nombre maximum de messages d\'historique injectés dans le prompt (défaut : 10)',
    example: 6,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  maxHistoryMessages?: number;
}

/**
 * Représentation d'un message dans l'historique
 */
export class MessageDto {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ content: string; source?: string; score?: number }>;
}

/**
 * Métadonnées d'une conversation
 */
export class ConversationMetaDto {
  id: string;
  title: string;
  mode: ConversationMode;
  useHistory: boolean;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Conversation complète avec messages
 */
export class ConversationDto extends ConversationMetaDto {
  messages: MessageDto[];
}

/**
 * Réponse après envoi d'un message
 */
export class ChatResponseDto {
  conversationId: string;
  message: MessageDto;
  sources?: Array<{ content: string; source?: string; score?: number }>;
}
