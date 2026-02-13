import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';
import { OllamaProvider } from './providers/ollama.provider';
import { GroqProvider } from './providers/groq.provider';

@Module({
  imports: [ConfigModule],
  controllers: [LLMController],
  providers: [LLMService, OllamaProvider, GroqProvider],
  exports: [LLMService], // Exporter pour utilisation dans autres modules
})
export class LLMModule {}