/**
 * Résultat d'une recherche web
 */
export interface SearchResult {
  /**
   * Titre de la page web
   */
  title: string;

  /**
   * URL complète de la ressource
   */
  url: string;

  /**
   * Extrait de contenu pertinent
   */
  snippet: string;

  /**
   * Score de pertinence (0-1)
   */
  score?: number;

  /**
   * Métadonnées additionnelles
   */
  metadata?: {
    /**
     * Date de publication (si disponible)
     */
    publishedDate?: string;

    /**
     * Auteur (si disponible)
     */
    author?: string;

    /**
     * Domaine source
     */
    domain?: string;

    /**
     * Image associée (URL)
     */
    imageUrl?: string;

    /**
     * Données brutes du provider
     */
    raw?: any;
  };
}

/**
 * Métadonnées de la requête de recherche
 */
export interface SearchMetadata {
  /**
   * Provider utilisé (tavily, searxng)
   */
  provider: string;

  /**
   * Niveau de complexité détecté
   */
  complexity: 'low' | 'medium' | 'high';

  /**
   * Durée de la recherche en ms
   */
  duration: number;

  /**
   * Résultat provenant du cache
   */
  cached: boolean;

  /**
   * Quota restant (pour Tavily)
   */
  quotaRemaining?: number;

  /**
   * Raison du fallback (si applicable)
   */
  fallbackReason?: string;

  /**
   * Timestamp de la requête
   */
  timestamp: string;
}
