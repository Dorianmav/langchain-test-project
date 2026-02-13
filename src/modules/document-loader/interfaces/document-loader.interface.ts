import { Document } from '@langchain/core/documents';

/**
 * Interface commune pour tous les loaders de documents
 * Chaque loader (PDF, TXT, etc.) doit implémenter cette interface
 */
export interface IDocumentLoader {
  /**
   * Type de fichier supporté (pdf, txt, md, json, csv)
   */
  getSupportedType(): string;

  /**
   * Charge et parse un document depuis un fichier
   * @param filePath - Chemin absolu du fichier
   * @param metadata - Métadonnées optionnelles à ajouter au document
   * @returns Array de Documents LangChain
   */
  load(filePath: string, metadata?: Record<string, any>): Promise<Document[]>;

  /**
   * Vérifie si le loader peut traiter ce type de fichier
   * @param fileType - Extension du fichier (pdf, txt, etc.)
   */
  canHandle(fileType: string): boolean;
}

/**
 * Configuration pour le chunking (découpage) des documents
 */
export interface ChunkConfig {
  /** Taille maximale d'un chunk en caractères (défaut: 1000) */
  chunkSize?: number;
  
  /** Nombre de caractères qui se chevauchent entre chunks (défaut: 200) */
  chunkOverlap?: number;
  
  /** Séparateurs personnalisés pour découper le texte (défaut: ['\n\n', '\n', ' ']) */
  separators?: string[];
}

/**
 * Métadonnées enrichies d'un document chargé
 */
export interface DocumentMetadata {
  /** Chemin source du fichier */
  source: string;
  
  /** Nom du fichier */
  fileName: string;
  
  /** Type MIME du fichier */
  fileType: string;
  
  /** Taille du fichier en bytes */
  fileSize: number;
  
  /** Date d'upload */
  uploadedAt: Date;
  
  /** Index du chunk (si le document est découpé) */
  chunkIndex?: number;
  
  /** Nombre total de chunks générés */
  totalChunks?: number;
  
  /** Métadonnées personnalisées supplémentaires */
  [key: string]: any;
}
