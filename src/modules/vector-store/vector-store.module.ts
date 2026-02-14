import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { VectorStoreService } from './vector-store.service';
import { VectorStoreController } from './vector-store.controller';
import { VectorStoreSearchService, VectorStoreCrudService, VectorStoreHealthService } from './services';
import { ChromaProvider } from './providers/chroma.provider';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [
    ConfigModule, 
    EmbeddingsModule,
    CacheModule.register({
      ttl: 300, // 5 minutes en secondes
      max: 100, // Maximum 100 entrées en cache
    }),
  ],
  controllers: [VectorStoreController],
  providers: [
    VectorStoreService,
    VectorStoreSearchService,
    VectorStoreCrudService,
    VectorStoreHealthService,
    ChromaProvider,
  ],
  exports: [VectorStoreService], // Exporter pour utilisation dans RAG
})
export class VectorStoreModule {}
