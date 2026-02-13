import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { OllamaProvider } from './providers/ollama.provider';
import { GroqProvider } from './providers/groq.provider';
import { ILLMProvider, LLMConfig, LLMMetadata } from './interfaces/llm-provider.interface';
import { LLM_PROVIDERS } from './constants/llm.constants';
import { ChatMessageDto } from './dto/chat.dto';

/**
 * Service principal LLM avec pattern Factory
 * Gère automatiquement le choix du provider (Ollama par défaut, Groq en fallback)
 */
@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private currentProvider: ILLMProvider;
  private providerName: string;

  constructor(
    private configService: ConfigService,
    private ollamaProvider: OllamaProvider,
    private groqProvider: GroqProvider,
  ) {
    this.initializeProvider();
  }

  /**
   * Initialise le provider à utiliser
   * Priorité : Ollama (local) > Groq (API)
   */
  private async initializeProvider() {
    try {
      // Essayer Ollama en premier (local, gratuit, privé)
      const ollamaHealthy = await this.ollamaProvider.healthCheck();
      
      if (ollamaHealthy) {
        this.currentProvider = this.ollamaProvider;
        this.providerName = LLM_PROVIDERS.OLLAMA;
        this.logger.log('✅ Using Ollama provider (local)');
        return;
      }

      // Fallback sur Groq si Ollama indisponible
      const groqHealthy = await this.groqProvider.healthCheck();
      
      if (groqHealthy) {
        this.currentProvider = this.groqProvider;
        this.providerName = LLM_PROVIDERS.GROQ;
        this.logger.log('⚠️ Ollama unavailable, using Groq provider (API)');
        return;
      }

      this.logger.error('❌ No LLM provider available!');
      throw new Error('No LLM provider available');
    } catch (error) {
      this.logger.error('Provider initialization failed:', error);
      
      // Par défaut, utiliser Ollama même si health check échoue
      this.currentProvider = this.ollamaProvider;
      this.providerName = LLM_PROVIDERS.OLLAMA;
      this.logger.warn('Defaulting to Ollama provider');
    }
  }

  /**
   * Génération simple
   */
  async generate(prompt: string, config?: LLMConfig): Promise<{ response: string; metadata: LLMMetadata }> {
    const startTime = Date.now();

    try {
      const response = await this.currentProvider.generate(prompt, config);
      
      const metadata: LLMMetadata = {
        provider: this.providerName,
        model: config?.model || this.configService.get('OLLAMA_MODEL', 'llama3.2'),
        duration: Date.now() - startTime,
      };

      return { response, metadata };
    } catch (error) {
      this.logger.error('Generation failed:', error);
      throw error;
    }
  }

  /**
   * Chat avec historique
   */
  async chat(
    messagesDto: ChatMessageDto[], 
    config?: LLMConfig
  ): Promise<{ response: string; metadata: LLMMetadata }> {
    const startTime = Date.now();

    try {
      // Convertir les DTOs en messages LangChain
      const messages = messagesDto.map(msg => {
        switch (msg.role) {
          case 'user':
            return new HumanMessage(msg.content);
          case 'assistant':
            return new AIMessage(msg.content);
          case 'system':
            return new SystemMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      });

      const response = await this.currentProvider.chat(messages, config);
      
      const metadata: LLMMetadata = {
        provider: this.providerName,
        model: config?.model || this.configService.get('OLLAMA_MODEL', 'llama3.2'),
        duration: Date.now() - startTime,
      };

      return { response, metadata };
    } catch (error) {
      this.logger.error('Chat failed:', error);
      throw error;
    }
  }

  /**
   * Streaming (Server-Sent Events)
   */
  async *stream(prompt: string, config?: LLMConfig): AsyncGenerator<string> {
    const chunks: string[] = [];

    await this.currentProvider.stream(
      prompt,
      (token: string) => {
        chunks.push(token);
      },
      config
    );

    for (const chunk of chunks) {
      yield chunk;
    }
  }

  /**
   * Obtenir le provider actuel
   */
  getCurrentProvider(): string {
    return this.providerName;
  }

  /**
   * Forcer l'utilisation d'un provider spécifique
   */
  async switchProvider(providerName: 'ollama' | 'groq'): Promise<void> {
    if (providerName === 'ollama') {
      const healthy = await this.ollamaProvider.healthCheck();
      if (!healthy) {
        throw new Error('Ollama provider is not available');
      }
      this.currentProvider = this.ollamaProvider;
      this.providerName = LLM_PROVIDERS.OLLAMA;
    } else if (providerName === 'groq') {
      const healthy = await this.groqProvider.healthCheck();
      if (!healthy) {
        throw new Error('Groq provider is not available (check API key)');
      }
      this.currentProvider = this.groqProvider;
      this.providerName = LLM_PROVIDERS.GROQ;
    }

    this.logger.log(`Switched to ${providerName} provider`);
  }

  /**
   * Health check de tous les providers
   */
  async healthCheckAll(): Promise<{ ollama: boolean; groq: boolean; current: string }> {
    const [ollamaHealthy, groqHealthy] = await Promise.all([
      this.ollamaProvider.healthCheck(),
      this.groqProvider.healthCheck(),
    ]);

    return {
      ollama: ollamaHealthy,
      groq: groqHealthy,
      current: this.providerName,
    };
  }
}