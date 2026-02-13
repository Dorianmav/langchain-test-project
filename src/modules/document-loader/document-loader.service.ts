import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { IDocumentLoader, ChunkConfig } from './interfaces/document-loader.interface';
import { PdfLoader } from './loaders/pdf.loader';
import { TextLoader } from './loaders/text.loader';
import { MarkdownLoader } from './loaders/markdown.loader';
import { JsonLoader } from './loaders/json.loader';
import { CsvLoader } from './loaders/csv.loader';
import * as path from 'path';

/**
 * Service principal pour charger et découper des documents
 * Gère automatiquement le bon loader selon le type de fichier
 */
@Injectable()
export class DocumentLoaderService {
  private readonly logger = new Logger(DocumentLoaderService.name);
  private readonly loaders: Map<string, IDocumentLoader> = new Map();

  constructor(
    private readonly pdfLoader: PdfLoader,
    private readonly textLoader: TextLoader,
    private readonly markdownLoader: MarkdownLoader,
    private readonly jsonLoader: JsonLoader,
    private readonly csvLoader: CsvLoader,
  ) {
    // Enregistrer tous les loaders disponibles
    this.registerLoader(this.pdfLoader);
    this.registerLoader(this.textLoader);
    this.registerLoader(this.markdownLoader);
    this.registerLoader(this.jsonLoader);
    this.registerLoader(this.csvLoader);

    this.logger.log(`✅ Registered ${this.loaders.size} document loaders`);
  }

  /**
   * Enregistre un loader dans le service
   */
  private registerLoader(loader: IDocumentLoader): void {
    this.loaders.set(loader.getSupportedType(), loader);
  }

  /**
   * Récupère le loader approprié pour un type de fichier
   */
  private getLoader(fileType: string): IDocumentLoader {
    const loader = this.loaders.get(fileType.toLowerCase());
    
    if (!loader) {
      throw new BadRequestException(
        `Unsupported file type: ${fileType}. Supported types: ${Array.from(this.loaders.keys()).join(', ')}`
      );
    }

    return loader;
  }

  /**
   * Extrait l'extension d'un fichier
   */
  private getFileExtension(filePath: string): string {
    return path.extname(filePath).slice(1).toLowerCase();
  }

  /**
   * Charge un document depuis un fichier
   * @param filePath - Chemin du fichier
   * @param metadata - Métadonnées optionnelles
   * @returns Documents LangChain chargés
   */
  async loadDocument(
    filePath: string, 
    metadata: Record<string, any> = {}
  ): Promise<Document[]> {
    const fileType = this.getFileExtension(filePath);
    const loader = this.getLoader(fileType);

    this.logger.log(`📂 Loading document: ${path.basename(filePath)} (${fileType})`);

    return loader.load(filePath, metadata);
  }

  /**
   * Charge ET découpe un document en chunks
   * @param filePath - Chemin du fichier
   * @param config - Configuration du chunking
   * @param metadata - Métadonnées optionnelles
   * @returns Documents découpés en chunks
   */
  async loadAndSplit(
    filePath: string,
    config: ChunkConfig = {},
    metadata: Record<string, any> = {}
  ): Promise<Document[]> {
    // 1. Charger le document
    const documents = await this.loadDocument(filePath, metadata);

    // 2. Créer le splitter avec la configuration
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize || 1000,
      chunkOverlap: config.chunkOverlap || 200,
      separators: config.separators || ['\n\n', '\n', ' ', ''],
    });

    this.logger.log(
      `✂️  Splitting document into chunks (size: ${config.chunkSize || 1000}, overlap: ${config.chunkOverlap || 200})`
    );

    // 3. Découper tous les documents
    const allChunks: Document[] = [];
    
    for (const doc of documents) {
      const chunks = await splitter.splitDocuments([doc]);
      
      // Enrichir les métadonnées de chaque chunk
      chunks.forEach((chunk, index) => {
        chunk.metadata = {
          ...chunk.metadata,
          chunkIndex: index,
          totalChunks: chunks.length,
          chunkSize: chunk.pageContent.length,
        };
      });

      allChunks.push(...chunks);
    }

    this.logger.log(`✅ Document split into ${allChunks.length} chunks`);

    return allChunks;
  }

  /**
   * Liste les types de fichiers supportés
   */
  getSupportedTypes(): string[] {
    return Array.from(this.loaders.keys());
  }

  /**
   * Vérifie si un type de fichier est supporté
   */
  isSupported(fileType: string): boolean {
    return this.loaders.has(fileType.toLowerCase());
  }
}
