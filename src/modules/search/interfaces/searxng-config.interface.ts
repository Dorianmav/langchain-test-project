import { SearchConfig } from './search-config.interface';

/**
 * Options de configuration SearXNG
 */
export interface SearXNGConfig extends SearchConfig {
  /**
   * Moteurs à utiliser
   */
  engines?: string[];

  /**
   * Catégories de recherche
   */
  categories?: string[];

  /**
   * Format de sortie
   */
  format?: 'json' | 'csv' | 'rss';

  /**
   * Pagination
   */
  pageNumber?: number;

  /**
   * Safe search
   */
  safeSearch?: 0 | 1 | 2; // 0=none, 1=moderate, 2=strict
}
