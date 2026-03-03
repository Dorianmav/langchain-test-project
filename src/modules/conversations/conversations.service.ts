import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RedisChatMemoryService } from '../../common/memory/redis-chat-memory.service';
import {
  ConversationMetaDto,
  ConversationDto,
  CreateConversationDto,
  UpdateConversationDto,
  SendMessageDto,
  MessageDto,
  ChatResponseDto,
} from './dto/conversation.dto';
import { ConversationsIndexService, ConversationMeta } from './conversations-index.service';
import { ConversationsChatService } from './conversations-chat.service';

/** TTL Redis des conversations : 30 jours */
const MEMORY_TTL = 86400 * 30;

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly index: ConversationsIndexService,
    private readonly chat: ConversationsChatService,
    private readonly memoryService: RedisChatMemoryService,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async listConversations(): Promise<ConversationMetaDto[]> {
    const { conversations } = this.index.read();
    return conversations.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async createConversation(dto: CreateConversationDto): Promise<ConversationMetaDto> {
    const now = new Date().toISOString();
    const meta: ConversationMeta = {
      id: uuidv4(),
      title: dto.title || 'Nouvelle conversation',
      mode: dto.mode || 'chat',
      useHistory: dto.useHistory ?? true,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.index.upsert(meta);
    this.logger.log(`Conversation created: ${meta.id} (mode: ${meta.mode})`);
    return meta;
  }

  async getConversation(id: string): Promise<ConversationDto> {
    const meta = this.requireMeta(id);
    const rawMessages = await this.memoryService.getMessages(id);

    const messages: MessageDto[] = rawMessages.map(msg => {
      const type = (msg as any).type || msg._getType?.() || 'human';
      const parsed = this.chat.parseContent(msg.content as string);
      return {
        role: (type === 'human' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: parsed.content,
        timestamp: parsed.timestamp || meta.createdAt,
        sources: parsed.sources,
      };
    });

    return { ...meta, messages };
  }

  async updateConversation(id: string, dto: UpdateConversationDto): Promise<ConversationMetaDto> {
    const meta = this.requireMeta(id);
    meta.title = dto.title;
    meta.updatedAt = new Date().toISOString();
    this.index.upsert(meta);
    return meta;
  }

  async deleteConversation(id: string): Promise<{ deleted: boolean }> {
    this.requireMeta(id);
    this.index.remove(id);
    await this.memoryService.clearMemory(id);
    this.logger.log(`Conversation deleted: ${id}`);
    return { deleted: true };
  }

  async clearConversationHistory(id: string): Promise<ConversationMetaDto> {
    const meta = this.requireMeta(id);
    await this.memoryService.clearMemory(id);
    meta.messageCount = 0;
    meta.updatedAt = new Date().toISOString();
    this.index.upsert(meta);
    this.logger.log(`History cleared for conversation: ${id}`);
    return meta;
  }

  // ─── Envoi de messages ────────────────────────────────────────────────────

  async sendMessage(conversationId: string, dto: SendMessageDto): Promise<ChatResponseDto> {
    const meta = this.requireMeta(conversationId);
    const timestamp = new Date().toISOString();

    let responseContent: string;
    let sources: ChatResponseDto['sources'] | undefined;

    // useHistory : priorité au champ du DTO (override ponctuel), sinon config de la conversation
    const useHistory = dto.useHistory ?? meta.useHistory;
    const maxHistoryMessages = dto.maxHistoryMessages ?? 10;

    if (meta.mode === 'rag') {
      ({ responseContent, sources } = await this.chat.handleRagMessage(conversationId, dto, { useHistory, maxHistoryMessages }));
    } else {
      responseContent = await this.chat.handleChatMessage(conversationId, dto, { useHistory, maxHistoryMessages });
    }

    const userContent = this.encode(dto.message, timestamp);
    const aiContent = this.encode(responseContent, timestamp, sources);

    await this.memoryService.addUserMessage(conversationId, userContent, MEMORY_TTL);
    await this.memoryService.addAIMessage(conversationId, aiContent, MEMORY_TTL);

    meta.messageCount += 2;
    meta.updatedAt = timestamp;
    if (meta.messageCount === 2 && meta.title === 'Nouvelle conversation') {
      meta.title = this.generateTitle(dto.message);
    }
    this.index.upsert(meta);

    const message: MessageDto = { role: 'assistant', content: responseContent, timestamp, sources };
    return { conversationId, message, sources };
  }

  // ─── Helpers privés ────────────────────────────────────────────────────

  private requireMeta(id: string): ConversationMeta {
    const meta = this.index.findOne(id);
    if (!meta) throw new NotFoundException(`Conversation ${id} not found`);
    return meta;
  }

  private encode(content: string, timestamp: string, sources?: ChatResponseDto['sources']): string {
    return JSON.stringify({ content, timestamp, sources });
  }

  private generateTitle(message: string): string {
    const words = message.trim().split(/\s+/).slice(0, 6).join(' ');
    return words.length < message.trim().length ? `${words}â€¦` : words;
  }
}
