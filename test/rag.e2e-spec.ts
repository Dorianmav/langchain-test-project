import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { RagController } from '../src/modules/rag/rag.controller';
import { RagService } from '../src/modules/rag/rag.service';
import { createTestApp, baseTestImports } from './helpers/app.helper';

/**
 * Mocks du service RAG
 */
const mockRagService = {
  ingestDocument: jest.fn().mockResolvedValue({
    success: true,
    filePath: './test-data/rag-documentation.md',
    chunks: 12,
    metadata: {
      source: 'rag-documentation.md',
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddings: 'nomic-embed-text',
      vectorStore: 'chroma',
    },
  }),
  query: jest.fn().mockResolvedValue({
    answer: 'LangChain est un framework open-source pour construire des applications basées sur les LLMs.',
    sources: [
      {
        content: 'LangChain est un framework open-source...',
        metadata: { source: 'rag-documentation.md', page: 1 },
        score: 0.92,
      },
    ],
    metadata: {
      model: 'llama3.1:8b',
      provider: 'ollama',
      topK: 4,
      duration: 1800,
      documentsRetrieved: 4,
    },
  }),
};

/**
 * Tests e2e — RAG Controller
 * POST /rag/ingest | POST /rag/query
 */
describe('RagController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...baseTestImports()],
      controllers: [RagController],
      providers: [{ provide: RagService, useValue: mockRagService }],
    }).compile();

    app = await createTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRagService.ingestDocument.mockResolvedValue({
      success: true,
      filePath: './test-data/rag-documentation.md',
      chunks: 12,
      metadata: { source: 'rag-documentation.md', chunkSize: 1000, chunkOverlap: 200, embeddings: 'nomic-embed-text', vectorStore: 'chroma' },
    });
    mockRagService.query.mockResolvedValue({
      answer: 'LangChain est un framework open-source.',
      sources: [{ content: 'LangChain...', metadata: { source: 'doc.md' }, score: 0.92 }],
      metadata: { model: 'llama3.1:8b', provider: 'ollama', topK: 4, duration: 1800, documentsRetrieved: 4 },
    });
  });

  // ─── POST /rag/ingest ────────────────────────────────────────────────────────

  describe('POST /rag/ingest', () => {
    it('✅ ingère un document texte avec succès', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/ingest')
        .send({
          filePath: './test-data/rag-documentation.md',
          chunkSize: 1000,
          chunkOverlap: 200,
        })
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('chunks');
      expect(res.body).toHaveProperty('metadata');
      expect(typeof res.body.chunks).toBe('number');
      expect(res.body.chunks).toBeGreaterThan(0);
      expect(mockRagService.ingestDocument).toHaveBeenCalledTimes(1);
    });

    it('✅ ingère avec les paramètres par défaut (sans chunkSize/chunkOverlap)', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/ingest')
        .send({ filePath: './test-data/test-document.txt' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('✅ retourne les métadonnées d\'ingestion', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/ingest')
        .send({ filePath: './test-data/configuration.txt' })
        .expect(201);

      expect(res.body.metadata).toHaveProperty('source');
      expect(res.body.metadata).toHaveProperty('vectorStore');
    });

    it('✅ passe les bons paramètres au service', async () => {
      await request(app.getHttpServer())
        .post('/rag/ingest')
        .send({
          filePath: './test-data/rag-documentation.md',
          chunkSize: 500,
          chunkOverlap: 50,
        })
        .expect(201);

      const calledDto = mockRagService.ingestDocument.mock.calls[0][0];
      expect(calledDto.filePath).toBe('./test-data/rag-documentation.md');
      expect(calledDto.chunkSize).toBe(500);
      expect(calledDto.chunkOverlap).toBe(50);
    });

    it('❌ retourne 400 si filePath est manquant', async () => {
      await request(app.getHttpServer())
        .post('/rag/ingest')
        .send({ chunkSize: 1000 })
        .expect(400);
    });

    it('❌ retourne 400 si filePath est vide', async () => {
      await request(app.getHttpServer())
        .post('/rag/ingest')
        .send({ filePath: '' })
        .expect(400);
    });

    it('❌ propage les erreurs du service (500)', async () => {
      mockRagService.ingestDocument.mockRejectedValueOnce(new Error('File not found'));
      await request(app.getHttpServer())
        .post('/rag/ingest')
        .send({ filePath: './nonexistent-file.txt' })
        .expect(500);
    });
  });

  // ─── POST /rag/query ─────────────────────────────────────────────────────────

  describe('POST /rag/query', () => {
    it('✅ répond à une question avec contexte et sources', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/query')
        .send({
          query: 'Qu\'est-ce que LangChain ?',
          topK: 4,
        })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('sources');
      expect(res.body).toHaveProperty('metadata');
      expect(Array.isArray(res.body.sources)).toBe(true);
      expect(mockRagService.query).toHaveBeenCalledTimes(1);
    });

    it('✅ retourne les sources avec content et metadata', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/query')
        .send({ query: 'Comment fonctionne le RAG ?' })
        .expect(200);

      if (res.body.sources.length > 0) {
        const source = res.body.sources[0];
        expect(source).toHaveProperty('content');
        expect(source).toHaveProperty('metadata');
        expect(source).toHaveProperty('score');
      }
    });

    it('✅ passe le topK au service', async () => {
      await request(app.getHttpServer())
        .post('/rag/query')
        .send({ query: 'Explique LangChain', topK: 6 })
        .expect(200);

      const calledDto = mockRagService.query.mock.calls[0][0];
      expect(calledDto.topK).toBe(6);
    });

    it('✅ retourne les métadonnées de la requête', async () => {
      const res = await request(app.getHttpServer())
        .post('/rag/query')
        .send({ query: 'Qu\'est-ce que le RAG ?' })
        .expect(200);

      expect(res.body.metadata).toHaveProperty('model');
      expect(res.body.metadata).toHaveProperty('duration');
      expect(res.body.metadata).toHaveProperty('documentsRetrieved');
    });

    it('❌ retourne 400 si query est manquant', async () => {
      await request(app.getHttpServer())
        .post('/rag/query')
        .send({ topK: 4 })
        .expect(400);
    });

    it('❌ retourne 400 si query est vide', async () => {
      await request(app.getHttpServer())
        .post('/rag/query')
        .send({ query: '' })
        .expect(400);
    });

    it('❌ propage les erreurs du service (500)', async () => {
      mockRagService.query.mockRejectedValueOnce(new Error('Vector store connection failed'));
      await request(app.getHttpServer())
        .post('/rag/query')
        .send({ query: 'test query' })
        .expect(500);
    });
  });
});
