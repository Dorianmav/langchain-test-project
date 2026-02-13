import { Injectable, Logger } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { IDocumentLoader } from '../interfaces/document-loader.interface';
import * as fs from 'fs';
import csv from 'csv-parser';

/**
 * Loader pour les fichiers CSV
 * Crée un document par ligne du CSV
 */
@Injectable()
export class CsvLoader implements IDocumentLoader {
  private readonly logger = new Logger(CsvLoader.name);

  getSupportedType(): string {
    return 'csv';
  }

  canHandle(fileType: string): boolean {
    return fileType.toLowerCase() === 'csv';
  }

  async load(filePath: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    try {
      this.logger.log(`📈 Loading CSV file: ${filePath}`);

      const documents: Document[] = [];
      let headers: string[] = [];
      
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('headers', (headerList: string[]) => {
            headers = headerList;
            this.logger.log(`📋 CSV headers: ${headers.join(', ')}`);
          })
          .on('data', (row) => {
            // Formater chaque ligne en texte lisible
            const content = Object.entries(row)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');

            documents.push(new Document({
              pageContent: content,
              metadata: {
                ...metadata,
                source: filePath,
                rowNumber: documents.length + 1,
                headers,
                csvData: row, // Données brutes de la ligne
              },
            }));
          })
          .on('end', () => {
            this.logger.log(`✅ CSV file loaded: ${documents.length} rows`);
            resolve(documents);
          })
          .on('error', (error) => {
            this.logger.error(`❌ Error loading CSV file: ${error.message}`);
            reject(new Error(`Failed to load CSV file: ${error.message}`));
          });
      });
    } catch (error) {
      this.logger.error(`❌ Error loading CSV file: ${error.message}`);
      throw new Error(`Failed to load CSV file: ${error.message}`);
    }
  }
}
