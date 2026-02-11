import { SearchModule } from './modules/search/search.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentLoaderModule } from './modules/document-loader/document-loader.module';
import { VectorStoreModule } from './modules/vector-store/vector-store.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { LLMModule } from './modules/llm/llm.module';
import { RagModule } from './modules/rag/rag.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SearchModule,
    DocumentLoaderModule,
    VectorStoreModule,
    EmbeddingsModule,
    LLMModule,
    RagModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
