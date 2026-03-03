import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { LLMModule } from './modules/llm/llm.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { VectorStoreModule } from './modules/vector-store/vector-store.module';
import { DocumentLoaderModule } from './modules/document-loader/document-loader.module';
import { RagModule } from './modules/rag/rag.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { SearchModule } from './modules/search/search.module';
import { ChainsModule } from './modules/chains/chains.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { AuditModule } from './common/audit.module';
import { RedisModule } from './common/cache/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000, // 1 seconde
      limit: 10, // 10 requêtes par seconde
    }, {
      name: 'medium',
      ttl: 60000, // 1 minute
      limit: 100, // 100 requêtes par minute
    }, {
      name: 'long',
      ttl: 3600000, // 1 heure
      limit: 1000, // 1000 requêtes par heure
    }]),
    AuthModule,
    AuditModule,
    LLMModule,
    EmbeddingsModule,
    VectorStoreModule,
    DocumentLoaderModule,
    PromptsModule,
    SearchModule,
    RagModule,
    ChainsModule,
    AgentsModule,
    ConversationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
