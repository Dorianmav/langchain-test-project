import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, AIMessage, SystemMessage, ChatMessage } from '@langchain/core/messages';
import { ILLMProvider, LLMConfig } from '../interfaces/llm-provider.interface';
import { DEFAULT_LLM_CONFIG, GROQ_MODELS } from '../constants/llm.constants';

/**
 * Provider Groq - API cloud rapide
 * Nécessite une clé API (gratuit avec limites)
 */
@Injectable()
export class GroqProvider implements ILLMProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private llm: ChatGroq;
  private apiKey: string;
  private model: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY') ?? '';
    this.model = GROQ_MODELS.LLAMA3_8B; // Modèle par défaut (le plus rapide)

    if (!this.apiKey) {
      this.logger.warn('GROQ_API_KEY not configured - Groq provider will not work');
    } else {
      this.initializeLLM();
    }
  }

  /**
   * Initialise le client Groq
   */
  private initializeLLM(config?: LLMConfig) {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    this.llm = new ChatGroq({
      apiKey: this.apiKey,
      model: config?.model || this.model,
      temperature: config?.temperature ?? DEFAULT_LLM_CONFIG.temperature,
      maxTokens: config?.maxTokens ?? DEFAULT_LLM_CONFIG.maxTokens,
      topP: config?.topP ?? DEFAULT_LLM_CONFIG.topP,
      frequencyPenalty: config?.frequencyPenalty ?? DEFAULT_LLM_CONFIG.frequencyPenalty,
      presencePenalty: config?.presencePenalty ?? DEFAULT_LLM_CONFIG.presencePenalty,
    });

    this.logger.log(`Groq provider initialized - Model: ${this.model}`);
  }

  /**
   * Génération simple
   */
  async generate(prompt: string, config?: LLMConfig): Promise<string> {
    try {
      const startTime = Date.now();

      if (config) {
        this.initializeLLM(config);
      }

      const response = await this.llm.invoke([
        new HumanMessage(prompt)
      ]);

      const duration = Date.now() - startTime;
      this.logger.debug(`Groq generation completed in ${duration}ms`);

      return response.content.toString();
    } catch (error) {
      this.logger.error('Groq generation error:', error);
      
      if (error.message.includes('401')) {
        throw new Error('Invalid Groq API key');
      }
      if (error.message.includes('429')) {
        throw new Error('Groq rate limit exceeded');
      }
      
      throw new Error(`Groq generation failed: ${error.message}`);
    }
  }

  /**
   * Chat avec historique
   */
  async chat(messages: ChatMessage[], config?: LLMConfig): Promise<string> {
    try {
      const startTime = Date.now();

      if (config) {
        this.initializeLLM(config);
      }

      // Convertir les messages
      const formattedMessages = messages.map(msg => {
        const role = msg.constructor.name.toLowerCase();
        
        if (role.includes('human')) return new HumanMessage(msg.content.toString());
        if (role.includes('ai')) return new AIMessage(msg.content.toString());
        if (role.includes('system')) return new SystemMessage(msg.content.toString());
        
        return new HumanMessage(msg.content.toString());
      });

      const response = await this.llm.invoke(formattedMessages);

      const duration = Date.now() - startTime;
      this.logger.debug(`Groq chat completed in ${duration}ms`);

      return response.content.toString();
    } catch (error) {
      this.logger.error('Groq chat error:', error);
      throw new Error(`Groq chat failed: ${error.message}`);
    }
  }

  /**
   * Streaming
   */
  async stream(prompt: string, onToken: (token: string) => void, config?: LLMConfig): Promise<void> {
    try {
      if (config) {
        this.initializeLLM(config);
      }

      const stream = await this.llm.stream([
        new HumanMessage(prompt)
      ]);

      for await (const chunk of stream) {
        const token = chunk.content.toString();
        onToken(token);
      }

      this.logger.debug('Groq streaming completed');
    } catch (error) {
      this.logger.error('Groq streaming error:', error);
      throw new Error(`Groq streaming failed: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) return false;
      
      // Test simple avec un prompt court
      await this.generate('test', { maxTokens: 10 });
      return true;
    } catch (error) {
      this.logger.error('Groq health check failed:', error);
      return false;
    }
  }
}