import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IDocumentLoader } from '../interfaces/document-loader.interface';
import * as fs from 'fs/promises';
import { marked } from 'marked';

/**
 * Loader pour les fichiers Markdown (.md, .markdown)
 * Convertit le markdown en texte brut pour l'indexation
 */
@Injectable()
export class MarkdownLoader implements IDocumentLoader {
  private readonly logger = new Logger(MarkdownLoader.name);

  getSupportedType(): string {
    return 'md';
  }

  canHandle(fileType: string): boolean {
    const type = fileType.toLowerCase();
    return type === 'md' || type === 'markdown';
  }

  async load(filePath: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    try {
      this.logger.log(`📑 Loading markdown file: ${filePath}`);

      // Lire le contenu markdown
      const markdownContent = await fs.readFile(filePath, 'utf-8');
      
      // Convertir markdown en HTML
      const htmlContent = await marked(markdownContent, { async: true });
      
      // Supprimer les balises HTML pour obtenir du texte brut
      const plainText = htmlContent.replace(/<[^>]*>/g, '');

      // Créer un document avec le texte brut ET le markdown original
      const document = new Document({
        pageContent: plainText,
        metadata: {
          ...metadata,
          source: filePath,
          format: 'markdown',
          originalMarkdown: markdownContent, // Garder le markdown original
          contentLength: plainText.length,
        },
      });

      this.logger.log(`✅ Markdown file loaded: ${plainText.length} characters`);

      return [document];
    } catch (error) {
      this.logger.error(`❌ Error loading markdown file: ${error.message}`);
      throw new Error(`Failed to load markdown file: ${error.message}`);
    }
  }
}
