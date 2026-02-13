import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmbeddingsService } from './embeddings.service';
import { OllamaEmbeddingsProvider } from './providers/ollama-embeddings.provider';

@Module({
  imports: [ConfigModule],
  providers: [EmbeddingsService, OllamaEmbeddingsProvider],
  exports: [EmbeddingsService], // Exporter pour utilisation dans VectorStoreModule
})
export class EmbeddingsModule {}
