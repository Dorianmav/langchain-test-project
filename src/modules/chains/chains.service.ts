import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptTemplate } from '@langchain/core/prompts';
import { RedisService } from '../../common/cache/redis.service';
import { LLMService } from '../llm/llm.service';
import { SimpleChainDto, SimpleChainResponseDto, SequentialChainDto, SequentialChainResponseDto, StepResultDto } from './dto';
import * as crypto from 'crypto';

/**
 * Service pour les Chains LangChain
 * Implémente Simple Chain et Sequential Chain avec cache Redis
 */
@Injectable()
export class ChainsService {
  private readonly logger = new Logger(ChainsService.name);
  private readonly namespace = 'chains';
  private readonly cacheTTL = 1800; // 30 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly llmService: LLMService,
  ) {}

  /**
   * Simple Chain (LLMChain)
   * Chaîne basique : template + variables → LLM → résultat
   */
  async simpleChain(dto: SimpleChainDto): Promise<SimpleChainResponseDto> {
    const startTime = Date.now();

    // Vérifier cache Redis
    const cacheKey = this.generateCacheKey('simple', dto);
    const cached = await this.redisService.get<SimpleChainResponseDto>(this.namespace, cacheKey);

    if (cached) {
      this.logger.debug(`✅ Cache hit for simple chain: ${cacheKey.substring(0, 16)}...`);
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          duration: Date.now() - startTime,
        },
      };
    }

    try {
      // Créer le prompt template
      const prompt = PromptTemplate.fromTemplate(dto.template);

      // Générer la réponse via LLM
      const formattedPrompt = await prompt.format(dto.variables ?? {});
      const llmResponse = await this.llmService.generate(formattedPrompt, {
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
        model: dto.model,
      });

      const response: SimpleChainResponseDto = {
        result: llmResponse.response,
        metadata: {
          model: llmResponse.metadata.model,
          duration: Date.now() - startTime,
          cached: false,
          provider: llmResponse.metadata.provider,
        },
      };

      // Mettre en cache
      await this.redisService.set(this.namespace, cacheKey, response, this.cacheTTL);

      this.logger.log(`✅ Simple chain executed in ${response.metadata.duration}ms`);
      return response;
    } catch (error) {
      this.logger.error('Simple chain execution failed:', error);
      throw error;
    }
  }

  /**
   * Sequential Chain
   * Chaîne séquentielle : étape1 → étape2 → ... → résultat final
   * Output de chaque étape devient input de la suivante
   */
  async sequentialChain(dto: SequentialChainDto): Promise<SequentialChainResponseDto> {
    const startTime = Date.now();

    // Vérifier cache Redis
    const cacheKey = this.generateCacheKey('sequential', dto);
    const cached = await this.redisService.get<SequentialChainResponseDto>(this.namespace, cacheKey);

    if (cached) {
      this.logger.debug(`✅ Cache hit for sequential chain: ${cacheKey.substring(0, 16)}...`);
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
          totalDuration: Date.now() - startTime,
        },
      };
    }

    try {
      const stepResults: StepResultDto[] = [];
      let currentVariables = { ...(dto.initialVariables ?? {}) };

      // Exécuter chaque étape séquentiellement
      for (const step of dto.steps) {
        const stepStartTime = Date.now();

        // Créer le prompt pour cette étape
        const prompt = PromptTemplate.fromTemplate(step.template);
        const formattedPrompt = await prompt.format(currentVariables);

        // Exécuter via LLM
        const llmResponse = await this.llmService.generate(formattedPrompt, {
          temperature: dto.temperature,
          model: dto.model,
        });

        const stepDuration = Date.now() - stepStartTime;

        // Stocker le résultat de l'étape
        stepResults.push({
          stepName: step.name,
          output: llmResponse.response,
          duration: stepDuration,
        });

        // Ajouter l'output aux variables pour la prochaine étape
        currentVariables[step.outputKey] = llmResponse.response;

        this.logger.debug(`Step "${step.name}" completed in ${stepDuration}ms`);
      }

      // Le résultat final est l'output de la dernière étape
      const lastStep = dto.steps[dto.steps.length - 1];
      const finalResult = currentVariables[lastStep.outputKey];

      const response: SequentialChainResponseDto = {
        finalResult,
        stepResults,
        metadata: {
          totalSteps: dto.steps.length,
          totalDuration: Date.now() - startTime,
          cached: false,
        },
      };

      // Mettre en cache
      await this.redisService.set(this.namespace, cacheKey, response, this.cacheTTL);

      this.logger.log(`✅ Sequential chain (${dto.steps.length} steps) executed in ${response.metadata.totalDuration}ms`);
      return response;
    } catch (error) {
      this.logger.error('Sequential chain execution failed:', error);
      throw error;
    }
  }

  /**
   * Génère une clé de cache unique basée sur le type et les paramètres
   */
  private generateCacheKey(type: string, dto: any): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ type, ...dto }))
      .digest('hex');
    return hash;
  }

  /**
   * Invalider le cache des chains
   */
  async invalidateCache(pattern?: string): Promise<number> {
    const deletedCount = await this.redisService.clearPattern(this.namespace, pattern || '*');
    this.logger.log(`🗑️ Invalidated ${deletedCount} chain cache entries`);
    return deletedCount;
  }
}
