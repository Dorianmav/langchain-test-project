import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, AIMessage, SystemMessage, ChatMessage } from '@langchain/core/messages';
import { ILLMProvider, LLMConfig } from '../interfaces/llm-provider.interface';
import { DEFAULT_LLM_CONFIG } from '../constants/llm.constants';

/**
 * Provider Ollama - LLM local auto-hébergé
 * Utilise le serveur Ollama qui tourne en Docker
 */
@Injectable()
export class OllamaProvider implements ILLMProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private llm: ChatOllama;
  private baseUrl: string;
  private model: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    this.model = this.configService.get<string>('OLLAMA_MODEL', 'llama3.2:latest');

    this.initializeLLM();
  }

  /**
   * Initialise le client Ollama
   */
  private initializeLLM(config?: LLMConfig) {
    this.llm = new ChatOllama({
      baseUrl: this.baseUrl,
      model: this.model,
      temperature: config?.temperature ?? DEFAULT_LLM_CONFIG.temperature,
      numPredict: config?.maxTokens ?? DEFAULT_LLM_CONFIG.maxTokens,
      topP: config?.topP ?? DEFAULT_LLM_CONFIG.topP,
    });

    this.logger.log(`Ollama provider initialized: ${this.baseUrl} - Model: ${this.model}`);
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
      this.logger.debug(`Ollama generation completed in ${duration}ms`);

      return response.content.toString();
    } catch (error) {
      this.logger.error('Ollama generation error:', error);
      throw new Error(`Ollama generation failed: ${error.message}`);
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

      // Convertir les messages au format LangChain
      const formattedMessages = messages.map(msg => {
        const role = msg.constructor.name.toLowerCase();
        
        if (role.includes('human')) return new HumanMessage(msg.content.toString());
        if (role.includes('ai')) return new AIMessage(msg.content.toString());
        if (role.includes('system')) return new SystemMessage(msg.content.toString());
        
        return new HumanMessage(msg.content.toString());
      });

      const response = await this.llm.invoke(formattedMessages);

      const duration = Date.now() - startTime;
      this.logger.debug(`Ollama chat completed in ${duration}ms`);

      return response.content.toString();
    } catch (error) {
      this.logger.error('Ollama chat error:', error);
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  /**
   * Streaming (génération progressive)
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

      this.logger.debug('Ollama streaming completed');
    } catch (error) {
      this.logger.error('Ollama streaming error:', error);
      throw new Error(`Ollama streaming failed: ${error.message}`);
    }
  }

  /**
   * Vérification de santé
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      this.logger.error('Ollama health check failed:', error);
      return false;
    }
  }
}