import { SearchResult, SearchMetadata } from './search-result.interface';
import { SearchConfig } from './search-config.interface';

/**
 * Interface commune pour tous les providers de recherche web
 */
export interface ISearchProvider {
  /**
   * Effectue une recherche web
   * @param query Terme de recherche
   * @param config Configuration optionnelle
   * @returns Résultats de la recherche
   */
  search(query: string, config?: SearchConfig): Promise<SearchResult[]>;

  /**
   * Vérifie la santé du provider
   * @returns true si le provider est disponible
   */
  healthCheck(): Promise<boolean>;

  /**
   * Retourne le nom du provider
   */
  getProviderName(): string;

  /**
   * Retourne si le provider est disponible
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Réponse complète de recherche avec métadonnées
 */
export interface SearchResponse {
  /**
   * Résultats de la recherche
   */
  results: SearchResult[];

  /**
   * Métadonnées de la recherche
   */
  metadata: SearchMetadata;

  /**
   * Requête originale
   */
  query: string;

  /**
   * Nombre total de résultats
   */
  totalResults: number;
}
