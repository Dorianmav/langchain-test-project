/**
 * Configuration pour une recherche web
 */
export interface SearchConfig {
  /**
   * Nombre maximum de résultats
   */
  maxResults?: number;

  /**
   * Langue préférée (ISO 639-1)
   */
  language?: string;

  /**
   * Région géographique (ISO 3166-1)
   */
  region?: string;

  /**
   * Filtre temporel
   */
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';

  /**
   * Inclure des images
   */
  includeImages?: boolean;

  /**
   * Domaines à inclure
   */
  includeDomains?: string[];

  /**
   * Domaines à exclure
   */
  excludeDomains?: string[];

  /**
   * Recherche stricte (exact match)
   */
  strictMode?: boolean;
}
