import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsIndexService } from './conversations-index.service';
import { ConversationsChatService } from './conversations-chat.service';
import { RedisModule } from '../../common/cache/redis.module';
import { RedisChatMemoryService } from '../../common/memory/redis-chat-memory.service';
import { LLMModule } from '../llm/llm.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';

/**
 * Module Conversations
 *
 * Gère les conversations multi-sessions avec persistance :
 * - Métadonnées (titre, mode, dates) → fichier JSON sur disque (data/conversations.json)
 * - Messages → Redis via RedisChatMemoryService (TTL 30 jours)
 *
 * Modes supportés :
 * - chat  : LLM direct avec historique conversationnel
 * - rag   : Recherche documentaire + LLM avec historique
 */
@Module({
  imports: [RedisModule, LLMModule, VectorStoreModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsIndexService,
    ConversationsChatService,
    RedisChatMemoryService,
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
