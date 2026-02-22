import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IDocumentLoader } from '../interfaces/document-loader.interface';
import { readFile } from 'fs/promises';
import { extractText, getDocumentProxy } from 'unpdf';

/**
 * Loader pour les fichiers PDF
 * Utilise unpdf pour extraire le texte brut des PDFs
 * unpdf est une alternative moderne à pdf-parse, compatible Node.js pur (pas de DOMMatrix requis)
 */
@Injectable()
export class PdfLoader implements IDocumentLoader {
  private readonly logger = new Logger(PdfLoader.name);

  getSupportedType(): string {
    return 'pdf';
  }

  canHandle(fileType: string): boolean {
    return fileType.toLowerCase() === 'pdf';
  }

  async load(filePath: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    try {
      this.logger.log(`📄 Loading PDF: ${filePath}`);

      // Lire le fichier PDF en buffer
      const dataBuffer = await readFile(filePath);

      this.logger.log(`📦 Buffer size: ${dataBuffer.length} bytes`);

      // Charger le document PDF via unpdf
      const pdf = await getDocumentProxy(new Uint8Array(dataBuffer));

      // Extraire le texte en fusionnant toutes les pages
      const { text, totalPages } = await extractText(pdf, { mergePages: true });

      this.logger.log(`✅ PDF parsed: ${totalPages} pages, ${text.length} characters`);

      // Créer un document LangChain avec le contenu extrait
      const document = new Document({
        pageContent: text,
        metadata: {
          ...metadata,
          source: filePath,
          totalPages,
        },
      });

      this.logger.log(`✅ PDF loaded: ${totalPages} pages, ${text.length} characters`);

      return [document];
    } catch (error) {
      this.logger.error(`❌ Error loading PDF: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw new Error(`Failed to load PDF: ${error.message}`);
    }
  }
}