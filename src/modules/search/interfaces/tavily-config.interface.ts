import { SearchConfig } from './search-config.interface';

/**
 * Options de configuration Tavily
 */
export interface TavilyConfig extends SearchConfig {
  /**
   * Profondeur de recherche
   */
  searchDepth?: 'basic' | 'advanced';

  /**
   * Inclure le contenu brut
   */
  includeRawContent?: boolean;

  /**
   * Inclure les réponses
   */
  includeAnswer?: boolean;
}

/**
 * Configuration pour l'extraction Tavily
 */
export interface TavilyExtractConfig {
  /**
   * URLs à extraire
   */
  urls: string[];

  /**
   * Inclure le contenu brut
   */
  includeRawContent?: boolean;
}

/**
 * Configuration pour la recherche approfondie Tavily
 */
export interface TavilyResearchConfig {
  /**
   * Requête de recherche
   */
  query: string;

  /**
   * Nombre maximum de sources
   */
  maxSources?: number;

  /**
   * Profondeur de recherche
   */
  searchDepth?: 'basic' | 'advanced';

  /**
   * Inclure les images
   */
  includeImages?: boolean;

  /**
   * Inclure le contenu brut
   */
  includeRawContent?: boolean;
}
