import { Injectable, Logger } from '@nestjs/common';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';

/**
 * Service dédié à la gestion du cache des prompts
 * Optimise les performances en évitant la recréation des templates
 */
@Injectable()
export class PromptCacheService {
  private readonly logger = new Logger(PromptCacheService.name);
  private readonly promptCache = new Map<string, ChatPromptTemplate | PromptTemplate>();

  /**
   * Récupère un prompt du cache
   */
  get(key: string): ChatPromptTemplate | PromptTemplate | undefined {
    const prompt = this.promptCache.get(key);
    if (prompt) {
      this.logger.debug(`Prompt loaded from cache: ${key}`);
    }
    return prompt;
  }

  /**
   * Ajoute un prompt au cache
   */
  set(key: string, prompt: ChatPromptTemplate | PromptTemplate): void {
    this.promptCache.set(key, prompt);
    this.logger.debug(`Prompt cached with key: ${key}`);
  }

  /**
   * Vérifie si une clé existe dans le cache
   */
  has(key: string): boolean {
    return this.promptCache.has(key);
  }

  /**
   * Supprime un prompt du cache
   */
  delete(key: string): boolean {
    return this.promptCache.delete(key);
  }

  /**
   * Vide le cache des prompts
   */
  clear(): void {
    this.logger.log('Clearing prompt cache');
    this.promptCache.clear();
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats() {
    return {
      size: this.promptCache.size,
      keys: Array.from(this.promptCache.keys()),
    };
  }

  /**
   * Génère une clé de cache basée sur les options
   */
  generateKey(params: {
    type: string;
    includeFewShot?: boolean;
    includeHistory?: boolean;
    maxLength?: number;
  }): string {
    return `${params.type}_${params.includeFewShot || false}_${params.includeHistory || false}_${params.maxLength || 200}`;
  }
}
