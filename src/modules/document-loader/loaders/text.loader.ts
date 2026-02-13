import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IDocumentLoader } from '../interfaces/document-loader.interface';
import * as fs from 'fs/promises';

/**
 * Loader pour les fichiers texte brut (.txt)
 * Lecture simple du contenu UTF-8
 */
@Injectable()
export class TextLoader implements IDocumentLoader {
  private readonly logger = new Logger(TextLoader.name);

  getSupportedType(): string {
    return 'txt';
  }

  canHandle(fileType: string): boolean {
    return fileType.toLowerCase() === 'txt';
  }

  async load(filePath: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    try {
      this.logger.log(`📝 Loading text file: ${filePath}`);

      // Lire le contenu du fichier en UTF-8
      const content = await fs.readFile(filePath, 'utf-8');

      // Créer un document LangChain
      const document = new Document({
        pageContent: content,
        metadata: {
          ...metadata,
          source: filePath,
          contentLength: content.length,
          encoding: 'utf-8',
        },
      });

      this.logger.log(`✅ Text file loaded: ${content.length} characters`);

      return [document];
    } catch (error) {
      this.logger.error(`❌ Error loading text file: ${error.message}`);
      throw new Error(`Failed to load text file: ${error.message}`);
    }
  }
}
