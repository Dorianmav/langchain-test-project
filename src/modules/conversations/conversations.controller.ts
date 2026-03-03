import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  UpdateConversationDto,
  SendMessageDto,
  ConversationMetaDto,
  ConversationDto,
  ChatResponseDto,
} from './dto/conversation.dto';

/**
 * Controller des conversations multi-sessions
 *
 * Endpoints :
 *  GET    /conversations              → liste toutes les conversations
 *  POST   /conversations              → crée une nouvelle conversation
 *  GET    /conversations/:id          → récupère une conversation + son historique
 *  PUT    /conversations/:id          → renomme une conversation
 *  DELETE /conversations/:id          → supprime une conversation
 *  POST   /conversations/:id/messages → envoie un message et retourne la réponse LLM
 *  DELETE /conversations/:id/history  → efface l'historique sans supprimer la conversation
 */
@ApiTags('Conversations')
@Controller('conversations')
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(private readonly conversationsService: ConversationsService) {}

  // ─── Liste ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Lister toutes les conversations',
    description: 'Retourne les métadonnées de toutes les conversations (sans les messages), triées par date décroissante.',
  })
  @ApiResponse({ status: 200, description: 'Liste des conversations', type: [ConversationMetaDto] })
  async listConversations(): Promise<ConversationMetaDto[]> {
    return this.conversationsService.listConversations();
  }

  // ─── Création ─────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une nouvelle conversation',
    description: 'Crée une conversation vide. Le mode détermine comment les messages seront traités : chat (LLM direct), rag (recherche documentaire + LLM).',
  })
  @ApiResponse({ status: 201, description: 'Conversation créée', type: ConversationMetaDto })
  async createConversation(@Body() dto: CreateConversationDto): Promise<ConversationMetaDto> {
    return this.conversationsService.createConversation(dto);
  }

  // ─── Lecture ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer une conversation avec son historique',
    description: 'Retourne les métadonnées et tous les messages d\'une conversation.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation avec messages', type: ConversationDto })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async getConversation(@Param('id') id: string): Promise<ConversationDto> {
    return this.conversationsService.getConversation(id);
  }

  // ─── Mise à jour ──────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({
    summary: 'Renommer une conversation',
    description: 'Modifie le titre d\'une conversation.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation mise à jour', type: ConversationMetaDto })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ConversationMetaDto> {
    return this.conversationsService.updateConversation(id, dto);
  }

  // ─── Suppression ──────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une conversation',
    description: 'Supprime la conversation et efface son historique de messages dans Redis.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation supprimée' })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async deleteConversation(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return this.conversationsService.deleteConversation(id);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  @Post(':id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envoyer un message dans une conversation',
    description:
      'Envoie un message utilisateur, appelle le LLM (avec ou sans RAG selon le mode), ' +
      'sauvegarde la réponse dans Redis, et retourne la réponse de l\'assistant.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation' })
  @ApiResponse({ status: 200, description: 'Réponse du LLM', type: ChatResponseDto })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<ChatResponseDto> {
    return this.conversationsService.sendMessage(id, dto);
  }

  // ─── Effacer l'historique ─────────────────────────────────────────────────

  @Delete(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Effacer l\'historique d\'une conversation',
    description: 'Supprime tous les messages Redis mais conserve la conversation et ses métadonnées.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la conversation' })
  @ApiResponse({ status: 200, description: 'Historique effacé', type: ConversationMetaDto })
  @ApiResponse({ status: 404, description: 'Conversation non trouvée' })
  async clearHistory(@Param('id') id: string): Promise<ConversationMetaDto> {
    return this.conversationsService.clearConversationHistory(id);
  }
}
