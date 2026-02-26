import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import * as fs from 'fs';
import request from 'supertest';
import { DocumentLoaderController } from '../src/modules/document-loader/document-loader.controller';
import { DocumentLoaderService } from '../src/modules/document-loader/document-loader.service';
import { createTestApp, baseTestImports } from './helpers/app.helper';

/**
 * Mock du DocumentLoaderService
 */
const mockDocumentLoaderService = {
  loadAndSplit: jest.fn().mockResolvedValue([
    {
      pageContent: 'Contenu du premier chunk du document test.',
      metadata: { source: 'test-document.txt', chunkIndex: 0 },
    },
    {
      pageContent: 'Contenu du deuxième chunk du document test.',
      metadata: { source: 'test-document.txt', chunkIndex: 1 },
    },
  ]),
  getSupportedTypes: jest.fn().mockReturnValue(['pdf', 'txt', 'md', 'json', 'csv']),
  getFileExtension: jest.fn().mockReturnValue('txt'),
};

/**
 * Tests e2e — Document Loader Controller
 * POST /documents/upload | POST /documents/process | GET /documents/supported-types
 */
describe('DocumentLoaderController (e2e)', () => {
  let app: INestApplication;
  let testFilePath: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...baseTestImports()],
      controllers: [DocumentLoaderController],
      providers: [{ provide: DocumentLoaderService, useValue: mockDocumentLoaderService }],
    }).compile();

    app = await createTestApp(moduleFixture);

    // Créer un fichier texte temporaire pour les tests d'upload
    testFilePath = path.join(process.cwd(), 'test-uploads', 'test-e2e-temp.txt');
    const uploadDir = path.dirname(testFilePath);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(testFilePath, 'Contenu de test pour e2e. LangChain est un framework pour les LLMs.', 'utf-8');
  });

  afterAll(async () => {
    // Nettoyer le fichier temporaire
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDocumentLoaderService.loadAndSplit.mockResolvedValue([
      { pageContent: 'Chunk 1', metadata: { source: 'test-document.txt', chunkIndex: 0 } },
      { pageContent: 'Chunk 2', metadata: { source: 'test-document.txt', chunkIndex: 1 } },
    ]);
    mockDocumentLoaderService.getSupportedTypes.mockReturnValue(['pdf', 'txt', 'md', 'json', 'csv']);
    mockDocumentLoaderService.getFileExtension.mockReturnValue('txt');
  });

  // ─── POST /documents/upload ──────────────────────────────────────────────────

  describe('POST /documents/upload', () => {
    it('✅ upload un fichier TXT avec succès', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/upload')
        .attach('file', testFilePath)
        .expect(201);

      expect(res.body).toHaveProperty('filePath');
      expect(res.body).toHaveProperty('fileName');
      expect(res.body).toHaveProperty('fileSize');
      expect(res.body).toHaveProperty('fileType', 'txt');
    });

    it('✅ upload un fichier avec metadata', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/upload')
        .attach('file', testFilePath)
        .field('metadata', JSON.stringify({ category: 'test', author: 'jest' }))
        .expect(201);

      expect(res.body).toHaveProperty('metadata');
      expect(res.body.metadata).toHaveProperty('category', 'test');
      expect(res.body.metadata).toHaveProperty('author', 'jest');
    });

    it('✅ retourne le bon nom de fichier original', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/upload')
        .attach('file', testFilePath)
        .expect(201);

      expect(res.body.fileName).toBe('test-e2e-temp.txt');
    });

    it('❌ retourne 400 si aucun fichier n\'est fourni', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload')
        .expect(400);
    });

    it('❌ retourne 400 pour un type de fichier non supporté (.exe)', async () => {
      // Créer un fichier .exe temporaire
      const exeFilePath = path.join(process.cwd(), 'test-uploads', 'test-invalid.exe');
      fs.writeFileSync(exeFilePath, 'fake binary content');

      try {
        await request(app.getHttpServer())
          .post('/documents/upload')
          .attach('file', exeFilePath)
          .expect(400);
      } finally {
        if (fs.existsSync(exeFilePath)) {
          fs.unlinkSync(exeFilePath);
        }
      }
    });
  });

  // ─── POST /documents/process ─────────────────────────────────────────────────

  describe('POST /documents/process', () => {
    it('✅ traite un document et retourne les chunks', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/process')
        .send({
          filePath: './test-data/test-document.txt',
          chunkSize: 1000,
          chunkOverlap: 200,
        })
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('chunksCount');
      expect(res.body).toHaveProperty('chunkIds');
      expect(res.body).toHaveProperty('uploadedAt');
      expect(Array.isArray(res.body.chunkIds)).toBe(true);
      expect(mockDocumentLoaderService.loadAndSplit).toHaveBeenCalledTimes(1);
    });

    it('✅ retourne le bon nombre de chunks', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/process')
        .send({ filePath: './test-data/test-document.txt' })
        .expect(200);

      expect(res.body.chunksCount).toBe(2); // 2 chunks mockés
      expect(res.body.chunkIds).toHaveLength(2);
    });

    it('✅ passe les bons paramètres au service', async () => {
      await request(app.getHttpServer())
        .post('/documents/process')
        .send({
          filePath: './test-data/test-document.txt',
          chunkSize: 500,
          chunkOverlap: 50,
        })
        .expect(200);

      expect(mockDocumentLoaderService.loadAndSplit).toHaveBeenCalledWith(
        './test-data/test-document.txt',
        { chunkSize: 500, chunkOverlap: 50 },
        undefined,
      );
    });

    it('✅ retourne les métadonnées du document', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/process')
        .send({ filePath: './test-data/test-document.txt', metadata: { source: 'test' } })
        .expect(200);

      expect(res.body).toHaveProperty('metadata');
    });

    it('❌ retourne 400 si filePath est manquant', async () => {
      await request(app.getHttpServer())
        .post('/documents/process')
        .send({ chunkSize: 1000 })
        .expect(400);
    });

    it('❌ propage les erreurs du service (500)', async () => {
      mockDocumentLoaderService.loadAndSplit.mockRejectedValueOnce(
        new Error('File not found: ./nonexistent.txt')
      );
      await request(app.getHttpServer())
        .post('/documents/process')
        .send({ filePath: './nonexistent.txt' })
        .expect(500);
    });
  });

  // ─── GET /documents/supported-types ─────────────────────────────────────────

  describe('GET /documents/supported-types', () => {
    it('✅ retourne les types de fichiers supportés', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents/supported-types')
        .expect(200);

      expect(res.body).toHaveProperty('supportedTypes');
      expect(Array.isArray(res.body.supportedTypes)).toBe(true);
      expect(mockDocumentLoaderService.getSupportedTypes).toHaveBeenCalledTimes(1);
    });

    it('✅ inclut les types essentiels (pdf, txt, md)', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents/supported-types')
        .expect(200);

      expect(res.body.supportedTypes).toContain('pdf');
      expect(res.body.supportedTypes).toContain('txt');
      expect(res.body.supportedTypes).toContain('md');
    });
  });
});
