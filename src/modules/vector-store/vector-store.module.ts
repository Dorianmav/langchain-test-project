import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreController } from './vector-store.controller';
import { VectorStoreSearchService, VectorStoreCrudService, VectorStoreHealthService } from './services';
import { ChromaProvider } from './providers/chroma.provider';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

// RedisModule est @Global() — RedisService est automatiquement disponible sans import explicite

@Module({
  imports: [
    ConfigModule,
    EmbeddingsModule,
  ],
  controllers: [VectorStoreController],
  providers: [
    VectorStoreService,
    VectorStoreSearchService,
    VectorStoreCrudService,
    VectorStoreHealthService,
    ChromaProvider,
  ],
  exports: [VectorStoreService],
})
export class VectorStoreModule {}
