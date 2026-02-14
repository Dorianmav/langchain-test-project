/**
 * Métadonnées sur la génération LLM
 */
export interface LLMMetadata {
  provider: string;          // 'groq' | 'ollama'
  model: string;             // Modèle utilisé
  tokensUsed?: number;       // Tokens consommés
  duration?: number;         // Durée en ms
  cached?: boolean;          // Réponse en cache
}
