import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { RedisService } from '../../../common/cache/redis.service';
import { LLMService } from '../../llm/llm.service';
import { PromptService } from '../../prompts/prompts.service';
import * as crypto from 'crypto';

/**
 * Service responsable de la génération de réponses RAG avec cache Redis
 * Construit le prompt et génère la réponse à partir du contexte
 * Cache les résultats avec namespace 'rag:*' pour optimiser performances
 */
@Injectable()
export class RagGenerationService {
  private readonly logger = new Logger(RagGenerationService.name);
  private readonly namespace = 'rag';

  constructor(
    private readonly redisService: RedisService,
    private readonly llm: LLMService,
    private readonly promptService: PromptService,
  ) {}

  /**
   * Génère une réponse avec le LLM à partir du contexte avec cache Redis
   */
  async generateAnswer(
    query: string,
    context: Document[],
    temperature: number = 0.7,
    includeFewShot: boolean = false,
    useAdvancedPrompt: boolean = false,
  ): Promise<{ answer: string; tokensUsed?: number; cached?: boolean }> {
    this.logger.log('🤖 Generating answer with LLM...');

    // Générer clé de cache basée sur query + context + params
    const cacheKey = this.generateCacheKey(query, context, temperature, includeFewShot, useAdvancedPrompt);
    
    // Vérifier cache Redis
    const cached = await this.redisService.get<{ answer: string; tokensUsed?: number }>(
      this.namespace, 
      cacheKey
    );

    if (cached) {
      this.logger.log(`✅ RAG cache hit for query: "${query.substring(0, 50)}..."`);
      return {
        ...cached,
        cached: true,
      };
    }

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

    const result = {
      answer: response,
      tokensUsed: undefined, // LLM service doesn't return token count yet
      cached: false,
    };

    // Mettre en cache (30 minutes = 1800 secondes)
    await this.redisService.set(this.namespace, cacheKey, result, 1800);

    return result;
  }

  /**
   * Génère une clé de cache unique pour la génération RAG
   */
  private generateCacheKey(
    query: string, 
    context: Document[], 
    temperature: number,
    includeFewShot: boolean,
    useAdvancedPrompt: boolean
  ): string {
    // Hash du contenu des documents
    const contextHash = crypto
      .createHash('sha256')
      .update(context.map(doc => doc.pageContent).join(''))
      .digest('hex')
      .substring(0, 16);

    const queryHash = crypto
      .createHash('sha256')
      .update(query)
      .digest('hex')
      .substring(0, 16);

    return `${queryHash}:${contextHash}:${temperature}:${includeFewShot}:${useAdvancedPrompt}`;
  }
}
