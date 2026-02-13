import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IDocumentLoader } from '../interfaces/document-loader.interface';
import * as fs from 'fs/promises';

/**
 * Loader pour les fichiers JSON
 * Si c'est un tableau → un document par élément
 * Si c'est un objet → un seul document
 */
@Injectable()
export class JsonLoader implements IDocumentLoader {
  private readonly logger = new Logger(JsonLoader.name);

  getSupportedType(): string {
    return 'json';
  }

  canHandle(fileType: string): boolean {
    return fileType.toLowerCase() === 'json';
  }

  async load(filePath: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    try {
      this.logger.log(`📊 Loading JSON file: ${filePath}`);

      // Lire et parser le JSON
      const content = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(content);

      // Si c'est un tableau, créer un document par élément
      if (Array.isArray(jsonData)) {
        this.logger.log(`🔢 JSON is an array with ${jsonData.length} items`);
        
        return jsonData.map((item, index) => new Document({
          pageContent: typeof item === 'string' ? item : JSON.stringify(item, null, 2),
          metadata: {
            ...metadata,
            source: filePath,
            arrayIndex: index,
            totalItems: jsonData.length,
            itemType: typeof item,
          },
        }));
      }

      // Sinon, un seul document pour tout l'objet
      this.logger.log(`📦 JSON is an object with ${Object.keys(jsonData).length} keys`);
      
      const document = new Document({
        pageContent: JSON.stringify(jsonData, null, 2),
        metadata: {
          ...metadata,
          source: filePath,
          jsonKeys: Object.keys(jsonData),
          objectType: 'single',
        },
      });

      this.logger.log(`✅ JSON file loaded: ${content.length} characters`);

      return [document];
    } catch (error) {
      this.logger.error(`❌ Error loading JSON file: ${error.message}`);
      throw new Error(`Failed to load JSON file: ${error.message}`);
    }
  }
}
