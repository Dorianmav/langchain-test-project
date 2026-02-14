/**
 * Configuration commune pour les LLM
 */
export interface LLMConfig {
  temperature?: number;      // Créativité (0-1)
  maxTokens?: number;        // Longueur max de réponse
  topP?: number;             // Nucleus sampling (0-1)
  frequencyPenalty?: number; // Pénalité de répétition
  presencePenalty?: number;  // Pénalité de présence
  model?: string;            // Nom du modèle
}
