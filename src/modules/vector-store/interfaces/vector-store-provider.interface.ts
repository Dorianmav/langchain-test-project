import { Document } from '@langchain/core/documents';

/**
 * Interface commune pour tous les vector stores
 */
export interface IVectorStoreProvider {
  /**
   * Ajouter des documents au vector store
   * @param documents - Documents avec text et metadata
   */
  addDocuments(documents: Document[]): Promise<string[]>;

  /**
   * Recherche par similarité
   * @param query - Requête de recherche
   * @param k - Nombre de résultats
   * @param filter - Filtres optionnels sur metadata
   */
  similaritySearch(query: string, k?: number, filter?: Record<string, any>): Promise<Document[]>;

  /**
   * Recherche avec scores de similarité
   * @param query - Requête de recherche
   * @param k - Nombre de résultats
   */
  similaritySearchWithScore(query: string, k?: number): Promise<[Document, number][]>;

  /**
   * Supprimer des documents
   * @param ids - IDs des documents à supprimer
   */
  deleteDocuments(ids: string[]): Promise<void>;

  /**
   * Mettre à jour un document existant
   * @param id - ID du document
   * @param content - Nouveau contenu (optionnel)
   * @param metadata - Nouvelles métadonnées (optionnel)
   */
  updateDocument(id: string, content?: string, metadata?: Record<string, any>): Promise<boolean>;

  /**
   * Obtenir le nombre de documents
   */
  getDocumentCount(): Promise<number>;

  /**
   * Récupérer tous les documents avec leurs IDs
   * @param limit - Nombre maximum de documents à retourner
   * @param offset - Offset pour la pagination
   */
  getAllDocuments(limit?: number, offset?: number): Promise<Array<{ id: string; content: string; metadata: Record<string, any> }>>;

  /**
   * Health check
   */
  healthCheck(): Promise<boolean>;

  /**
   * Récupérer un document par son ID
   * @param id - ID du document
   */
  getDocumentById(id: string): Promise<{
    id: string;
    content: string;
    metadata: Record<string, any>;
  } | null>;
}

/**
 * Configuration d'un vector store
 */
export interface VectorStoreConfig {
  collectionName: string;
  dimension?: number;
  distance?: 'cosine' | 'euclidean' | 'dot';
}