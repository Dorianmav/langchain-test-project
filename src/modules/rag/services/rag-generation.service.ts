import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { LLMService } from '../../llm/llm.service';
import { PromptService } from '../../prompts/prompts.service';

/**
 * Service responsable de la génération de réponses avec le LLM
 * Construit le prompt et génère la réponse à partir du contexte
 */
@Injectable()
export class RagGenerationService {
  private readonly logger = new Logger(RagGenerationService.name);

  constructor(
    private readonly llm: LLMService,
    private readonly promptService: PromptService,
  ) {}

  /**
   * Génère une réponse avec le LLM à partir du contexte
   */
  async generateAnswer(
    query: string,
    context: Document[],
    temperature: number = 0.7,
    includeFewShot: boolean = false,
    useAdvancedPrompt: boolean = false,
  ): Promise<{ answer: string; tokensUsed?: number }> {
    this.logger.log('🤖 Generating answer with LLM...');

    // Construire le contexte à partir des documents
    const contextText = context
      .map((doc, index) => `[Document ${index + 1}]\n${doc.pageContent}`)
      .join('\n\n---\n\n');

    let prompt: string;

    if (useAdvancedPrompt) {
      // Utiliser le prompt RAG avancé avec métadonnées
      this.logger.log('📝 Using advanced RAG prompt with metadata');
      prompt = await this.promptService.createAdvancedRagPrompt({
        context: contextText,
        question: query,
        source_count: context.length,
        min_score: 0.7,
      });
    } else {
      // Utiliser le prompt RAG standard ou avec few-shot
      this.logger.log(`📝 Using ${includeFewShot ? 'few-shot' : 'standard'} RAG prompt`);
      const promptResponse = await this.promptService.createPrompt({
        type: 'rag' as any,
        includeFewShot,
        variables: {
          context: contextText,
          question: query,
        },
      });
      prompt = promptResponse.prompt;
    }

    // Générer la réponse
    const { response } = await this.llm.generate(prompt, { temperature });

    this.logger.log('✅ Answer generated successfully');

    return {
      answer: response,
      tokensUsed: undefined, // LLM service doesn't return token count yet
    };
  }
}
