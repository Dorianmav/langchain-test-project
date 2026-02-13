/**
 * Interface commune pour tous les providers d'embeddings
 */
export interface IEmbeddingsProvider {
  /**
   * Génère un embedding pour un texte unique
   * @param text - Texte à vectoriser
   * @returns Vecteur d'embeddings
   */
  embedQuery(text: string): Promise<number[]>;

  /**
   * Génère des embeddings pour plusieurs documents
   * @param documents - Tableau de textes
   * @returns Tableau de vecteurs
   */
  embedDocuments(documents: string[]): Promise<number[][]>;

  /**
   * Obtenir la dimension des embeddings (ex: 384, 768, 1536)
   */
  getDimension(): number;

  /**
   * Nom du modèle utilisé
   */
  getModelName(): string;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Métadonnées d'un embedding
 */
export interface EmbeddingMetadata {
  provider: string;        // 'ollama' | 'huggingface'
  model: string;           // 'nomic-embed-text' | 'all-MiniLM-L6-v2'
  dimension: number;       // 384, 768, 1536...
  duration: number;        // Temps de génération en ms
}