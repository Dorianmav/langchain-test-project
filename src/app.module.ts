import { SearchModule } from './modules/search/search.module';
import { DocumentLoaderModule } from './modules/document-loader/document-loader.module';
import { VectorStoreModule } from './modules/vector-store/vector-store.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { LlmModule } from './modules/llm/llm.module';
import { RagModule } from './modules/rag/rag.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    SearchModule,
    DocumentLoaderModule,
    VectorStoreModule,
    EmbeddingsModule,
    LlmModule,
    RagModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
