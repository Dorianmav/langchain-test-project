import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { SearchController } from '../src/modules/search/search.controller';
import { SearchService } from '../src/modules/search/search.service';
import { createTestApp, baseTestImports, generateTestToken } from './helpers/app.helper';

/**
 * Mock du SearchService — évite les appels réseau réels (Tavily/SearXNG)
 */
const mockSearchService = {
  search: jest.fn().mockResolvedValue({
    results: [
      {
        title: 'NestJS Documentation',
        url: 'https://docs.nestjs.com',
        snippet: 'NestJS is a framework for building server-side applications.',
        score: 0.95,
        metadata: {},
      },
    ],
    metadata: {
      provider: 'searxng',
      complexity: 'low',
      duration: 120,
      cached: false,
      quotaRemaining: null,
      fallbackReason: null,
      timestamp: new Date().toISOString(),
    },
    query: 'NestJS',
    totalResults: 1,
  }),
  getQuotaStats: jest.fn().mockReturnValue({
    usedQuota: 10,
    quotaLimit: 1000,
    remainingQuota: 990,
    usagePercentage: 1,
    currentMonth: '2026-02',
    lastResetDate: '2026-02-01T00:00:00.000Z',
    history: [],
  }),
  checkHealth: jest.fn().mockResolvedValue({
    tavily: true,
    searxng: true,
  }),
  clearCache: jest.fn().mockResolvedValue({ message: 'Search cache cleared successfully', cleared: 3 }),
  resetQuota: jest.fn().mockReturnValue({ message: 'Quota reset successfully' }),
};

/**
 * Tests e2e — Search Controller
 * POST /search | GET /search/quota | GET /search/health
 * DELETE /search/cache | POST /search/quota/reset
 */
describe('SearchController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    token = generateTestToken();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...baseTestImports()],
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockSearchService }],
    }).compile();

    app = await createTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les mocks avec leurs valeurs par défaut
    mockSearchService.search.mockResolvedValue({
      results: [{ title: 'NestJS Documentation', url: 'https://docs.nestjs.com', snippet: 'NestJS framework.', score: 0.95, metadata: {} }],
      metadata: { provider: 'searxng', complexity: 'low', duration: 120, cached: false, quotaRemaining: null, fallbackReason: null, timestamp: new Date().toISOString() },
      query: 'NestJS',
      totalResults: 1,
    });
    mockSearchService.getQuotaStats.mockReturnValue({ usedQuota: 10, quotaLimit: 1000, remainingQuota: 990, usagePercentage: 1, currentMonth: '2026-02', lastResetDate: '2026-02-01T00:00:00.000Z', history: [] });
    mockSearchService.checkHealth.mockResolvedValue({ tavily: true, searxng: true });
    mockSearchService.clearCache.mockResolvedValue({ message: 'Search cache cleared successfully', cleared: 3 });
    mockSearchService.resetQuota.mockReturnValue({ message: 'Quota reset successfully' });
  });

  // ─── POST /search ────────────────────────────────────────────────────────────

  describe('POST /search', () => {
    it('✅ retourne des résultats pour une requête valide', async () => {
      const res = await request(app.getHttpServer())
        .post('/search')
        .send({ query: 'NestJS framework', maxResults: 5 })
        .expect(200);

      expect(res.body).toHaveProperty('results');
      expect(res.body).toHaveProperty('metadata');
      expect(res.body).toHaveProperty('query');
      expect(res.body).toHaveProperty('totalResults');
      expect(Array.isArray(res.body.results)).toBe(true);
      expect(mockSearchService.search).toHaveBeenCalledTimes(1);
    });

    it('✅ retourne des résultats avec forceProvider searxng', async () => {
      const res = await request(app.getHttpServer())
        .post('/search')
        .send({ query: 'LangChain', forceProvider: 'searxng' })
        .expect(200);

      expect(res.body.results.length).toBeGreaterThan(0);
    });

    it('✅ inclut les champs requis dans chaque résultat', async () => {
      const res = await request(app.getHttpServer())
        .post('/search')
        .send({ query: 'TypeScript' })
        .expect(200);

      const firstResult = res.body.results[0];
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('url');
      expect(firstResult).toHaveProperty('snippet');
    });

    it('❌ retourne 400 si query est vide', async () => {
      await request(app.getHttpServer())
        .post('/search')
        .send({ query: '' })
        .expect(400);
    });

    it('❌ retourne 400 si query est manquant', async () => {
      await request(app.getHttpServer())
        .post('/search')
        .send({ maxResults: 5 })
        .expect(400);
    });

    it('❌ retourne 400 si maxResults est hors limites (> 20)', async () => {
      await request(app.getHttpServer())
        .post('/search')
        .send({ query: 'test', maxResults: 50 })
        .expect(400);
    });

    it('❌ retourne 400 si forceProvider est invalide', async () => {
      await request(app.getHttpServer())
        .post('/search')
        .send({ query: 'test', forceProvider: 'unknown-provider' })
        .expect(400);
    });

    it('✅ propage les erreurs du service (500)', async () => {
      mockSearchService.search.mockRejectedValueOnce(new Error('Provider unavailable'));
      await request(app.getHttpServer())
        .post('/search')
        .send({ query: 'test' })
        .expect(500);
    });
  });

  // ─── GET /search/quota ───────────────────────────────────────────────────────

  describe('GET /search/quota', () => {
    it('✅ retourne les statistiques de quota', async () => {
      const res = await request(app.getHttpServer())
        .get('/search/quota')
        .expect(200);

      expect(res.body).toHaveProperty('usedQuota');
      expect(res.body).toHaveProperty('quotaLimit');
      expect(res.body).toHaveProperty('remainingQuota');
      expect(res.body).toHaveProperty('currentMonth');
      expect(mockSearchService.getQuotaStats).toHaveBeenCalledTimes(1);
    });
  });

  // ─── GET /search/health ──────────────────────────────────────────────────────

  describe('GET /search/health', () => {
    it('✅ retourne l\'état de santé des providers', async () => {
      const res = await request(app.getHttpServer())
        .get('/search/health')
        .expect(200);

      expect(res.body).toHaveProperty('tavily');
      expect(res.body).toHaveProperty('searxng');
      expect(typeof res.body.tavily).toBe('boolean');
      expect(typeof res.body.searxng).toBe('boolean');
    });

    it('✅ retourne false si un provider est indisponible', async () => {
      mockSearchService.checkHealth.mockResolvedValueOnce({ tavily: false, searxng: true });

      const res = await request(app.getHttpServer())
        .get('/search/health')
        .expect(200);

      expect(res.body.tavily).toBe(false);
    });
  });

  // ─── DELETE /search/cache ────────────────────────────────────────────────────

  describe('DELETE /search/cache', () => {
    it('✅ vide le cache et retourne le nombre d\'entrées supprimées', async () => {
      const res = await request(app.getHttpServer())
        .delete('/search/cache')
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('cleared');
      expect(typeof res.body.cleared).toBe('number');
      expect(mockSearchService.clearCache).toHaveBeenCalledTimes(1);
    });
  });

  // ─── POST /search/quota/reset ────────────────────────────────────────────────

  describe('POST /search/quota/reset', () => {
    it('✅ remet le quota à zéro', async () => {
      const res = await request(app.getHttpServer())
        .post('/search/quota/reset')
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(mockSearchService.resetQuota).toHaveBeenCalledTimes(1);
    });
  });
});
