/**
 * Type de chaîne pour Retrieval QA
 */
export enum ChainType {
  STUFF = 'stuff', // Combine tous les documents en un seul prompt
  MAP_REDUCE = 'map_reduce', // Traite chaque document séparément puis combine
  REFINE = 'refine', // Raffine progressivement la réponse
  MAP_RERANK = 'map_rerank', // Classe les réponses de chaque document
}
