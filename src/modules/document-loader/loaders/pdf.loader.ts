import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IDocumentLoader } from '../interfaces/document-loader.interface';
import { readFile } from 'fs/promises';

// Utilisation de require pour pdf-parse (module CommonJS)
// La fonction principale est PDFParse qui est une classe
const { PDFParse } = require('pdf-parse');

/**
 * Loader pour les fichiers PDF
 * Utilise pdf-parse pour extraire le texte brut des PDFs
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
      
      // Créer une instance de PDFParse et parser
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      const pdfText = result.text;

      this.logger.log(
        `✅ PDF parsed: ${result.total} pages, ${pdfText.length} characters`
      );

      // Créer un document LangChain avec le contenu extrait
      const document = new Document({
        pageContent: pdfText,
        metadata: {
          ...metadata,
          source: filePath,
          totalPages: result.total,
        },
      });

      this.logger.log(
        `✅ PDF loaded: ${result.total} pages, ${pdfText.length} characters`
      );

      return [document];
    } catch (error) {
      this.logger.error(`❌ Error loading PDF: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw new Error(`Failed to load PDF: ${error.message}`);
    }
  }
}
