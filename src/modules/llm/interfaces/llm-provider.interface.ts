import { BaseMessage } from '@langchain/core/messages';
import { LLMConfig } from './llm-config.interface';

/**
 * Interface commune pour tous les providers LLM
 * Permet de changer facilement de provider (Groq, Ollama, OpenAI, etc.)
 */
export interface ILLMProvider {
  /**
   * Génère une réponse à partir d'un prompt simple
   * @param prompt - Le texte d'entrée
   * @param config - Configuration optionnelle (temperature, maxTokens, etc.)
   * @returns La réponse générée
   */
  generate(prompt: string, config?: LLMConfig): Promise<string>;

  /**
   * Chat avec historique de conversation
   * @param messages - Tableau de messages (user/assistant)
   * @param config - Configuration optionnelle
   * @returns La réponse du LLM
   */
  chat(messages: BaseMessage[], config?: LLMConfig): Promise<string>;

  /**
   * Génération en streaming (réponse progressive)
   * @param prompt - Le texte d'entrée
   * @param onToken - Callback appelé pour chaque token généré
   * @param config - Configuration optionnelle
   */
  stream(prompt: string, onToken: (token: string) => void, config?: LLMConfig): Promise<void>;

  /**
   * Vérifie si le provider est disponible
   */
  healthCheck(): Promise<boolean>;
}