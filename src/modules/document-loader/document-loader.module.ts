import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentLoaderController } from './document-loader.controller';
import { DocumentLoaderService } from './document-loader.service';
import { PdfLoader } from './loaders/pdf.loader';
import { TextLoader } from './loaders/text.loader';
import { MarkdownLoader } from './loaders/markdown.loader';
import { JsonLoader } from './loaders/json.loader';
import { CsvLoader } from './loaders/csv.loader';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * Module de chargement et traitement de documents
 * Gère l'upload, le parsing et le chunking de documents
 */
@Module({
  imports: [
    // Configuration Multer pour l'upload de fichiers
    MulterModule.register({
      dest: './uploads',
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  ],
  controllers: [DocumentLoaderController],
  providers: [
    DocumentLoaderService,
    // Enregistrer tous les loaders
    PdfLoader,
    TextLoader,
    MarkdownLoader,
    JsonLoader,
    CsvLoader,
  ],
  exports: [DocumentLoaderService], // Exporter pour utilisation dans RAG
})
export class DocumentLoaderModule {}
