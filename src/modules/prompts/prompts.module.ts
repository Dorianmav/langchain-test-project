import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptService } from './prompts.service';
import { CustomTemplateService } from './services';

/**
 * Module de gestion des prompts
 * 
 * Fournit un service centralisé pour créer, formater et valider des prompts
 * avec support des templates LangChain et du few-shot learning
 */
@Module({
  controllers: [PromptsController],
  providers: [PromptService, CustomTemplateService],
  exports: [PromptService], // Export pour utilisation dans d'autres modules (RAG, LLM, etc.)
})
export class PromptsModule {}
