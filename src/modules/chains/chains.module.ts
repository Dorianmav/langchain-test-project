import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChainsService } from './chains.service';
import { RetrievalQAService } from './services/retrieval-qa.service';
import { ConversationalRetrievalService } from './services/conversational-retrieval.service';
import { ChainsController } from './chains.controller';
import { RedisModule } from '../../common/cache/redis.module';
import { RedisChatMemoryService } from '../../common/memory/redis-chat-memory.service';
import { LLMModule } from '../llm/llm.module';
import { VectorStoreModule } from '../vector-store/vector-store.module';

/**
 * Module Chains
 * Fournit des chaînes LangChain pour composer des opérations LLM
 */
@Module({
  imports: [
    ConfigModule,
    RedisModule,
    LLMModule,
    VectorStoreModule,
  ],
  controllers: [ChainsController],
  providers: [
    ChainsService,
    RetrievalQAService,
    ConversationalRetrievalService,
    RedisChatMemoryService,
  ],
  exports: [
    ChainsService,
    RetrievalQAService,
    ConversationalRetrievalService,
  ],
})
export class ChainsModule {}
