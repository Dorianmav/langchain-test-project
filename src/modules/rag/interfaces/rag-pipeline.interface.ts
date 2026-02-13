import { Document } from '@langchain/core/documents';

/**
 * Résultat d'une recherche de documents similaires
 */
export interface RetrievalResult {
  /** Documents trouvés */
  documents: Document[];
  
  /** Scores de similarité (0-1, plus haut = plus similaire) */
  scores: number[];
  
  /** Nombre total de résultats */
  totalResults: number;
  
  /** Temps de recherche en ms */
  searchTime: number;
}

/**
 * Résultat d'une génération RAG
 */
export interface GenerationResult {
  /** Réponse générée par le LLM */
  answer: string;
  
  /** Documents sources utilisés pour la génération */
  sourceDocuments: Document[];
  
  /** Métadonnées de génération */
  metadata: {
    model: string;
    tokensUsed?: number;
    generationTime: number;
  };
}

/**
 * Configuration du pipeline RAG
 */
export interface RAGPipelineConfig {
  /** Nombre de documents à récupérer (défaut: 4) */
  topK?: number;
  
  /** Score de similarité minimum (0-1, défaut: 0.7) */
  minScore?: number;
  
  /** Configuration du chunking */
  chunkConfig?: {
    chunkSize?: number;
    chunkOverlap?: number;
  };
  
  /** Température du LLM (0-1, défaut: 0.7) */
  temperature?: number;
  
  /** Modèle LLM à utiliser */
  model?: string;
}

/**
 * Résultat complet d'une pipeline RAG
 */
export interface RAGResult {
  /** Question posée */
  query: string;
  
  /** Réponse générée */
  answer: string;
  
  /** Documents sources */
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    score: number;
  }>;
  
  /** Statistiques de performance */
  stats: {
    retrievalTime: number;
    generationTime: number;
    totalTime: number;
    documentsRetrieved: number;
    tokensUsed?: number;
  };
}
