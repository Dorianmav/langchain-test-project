import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PromptsController } from '../src/modules/prompts/prompts.controller';
import { PromptService } from '../src/modules/prompts/prompts.service';
import { PromptUtilsService } from '../src/modules/prompts/services/prompt-utils.service';
import { createTestApp, baseTestImports } from './helpers/app.helper';

/**
 * Mocks des services Prompts
 */
const mockPromptService = {
  createPrompt: jest.fn().mockResolvedValue({
    prompt: 'Réponds à cette question en utilisant le contexte fourni. Question: {question}',
    type: 'RAG',
    variables: ['question', 'context'],
    template: 'Réponds à cette question en utilisant le contexte fourni.',
  }),
  formatPrompt: jest.fn().mockResolvedValue(
    'Réponds à cette question en utilisant le contexte fourni. Question: Comment fonctionne le RAG ?'
  ),
  validatePromptTemplate: jest.fn().mockReturnValue({
    isValid: true,
    variables: ['question', 'context'],
    missingVariables: [],
    errors: [],
  }),
  getFewShotExamples: jest.fn().mockReturnValue([
    { input: 'Qu\'est-ce que NestJS ?', output: 'NestJS est un framework Node.js.' },
  ]),
  getAllFewShotExamples: jest.fn().mockReturnValue({
    qa: [{ input: 'Qu\'est-ce que NestJS ?', output: 'NestJS est un framework Node.js.' }],
    translation: [],
    summarization: [],
    codeGeneration: [],
  }),
  getAllTemplates: jest.fn().mockReturnValue([
    { name: 'rag', type: 'RAG', description: 'Template RAG', variables: ['question', 'context'] },
    { name: 'search', type: 'SEARCH', description: 'Template Search', variables: ['query'] },
  ]),
  getAllTemplatesWithCustom: jest.fn().mockReturnValue({
    system: [{ name: 'rag', description: 'Template RAG', variables: ['question', 'context'] }],
    custom: [],
    total: 1,
  }),
  createCustomTemplate: jest.fn().mockReturnValue({
    name: 'my-custom-template',
    description: 'Mon template custom',
    template: 'Réponds en français : {question}',
    variables: ['question'],
    isSystem: false,
    createdAt: new Date().toISOString(),
  }),
  getTemplateByName: jest.fn().mockReturnValue({
    name: 'rag',
    description: 'Template RAG',
    template: 'Contexte: {context}\n\nQuestion: {question}',
    variables: ['context', 'question'],
    isSystem: true,
  }),
  updateCustomTemplate: jest.fn().mockReturnValue({
    name: 'my-custom-template',
    description: 'Template mis à jour',
    template: 'Réponds: {question}',
    variables: ['question'],
    isSystem: false,
  }),
  deleteCustomTemplate: jest.fn().mockReturnValue({ message: 'Template supprimé avec succès', name: 'my-custom-template' }),
  getDefaultTemplate: jest.fn().mockReturnValue('Contexte: {context}\n\nQuestion: {question}'),
  getCacheStats: jest.fn().mockReturnValue({ size: 5, hits: 12, misses: 3 }),
  clearCache: jest.fn(),
  createFewShotExample: jest.fn().mockReturnValue({
    id: 'example-001',
    category: 'qa',
    input: 'Qu\'est-ce que TypeScript ?',
    output: 'TypeScript est un superset de JavaScript.',
    createdAt: new Date().toISOString(),
  }),
  getCustomFewShotExamples: jest.fn().mockReturnValue([]),
  clearCustomExamples: jest.fn().mockReturnValue(0),
};

const mockPromptUtilsService = {
  extractVariables: jest.fn().mockReturnValue(['question', 'context']),
};

/**
 * Tests e2e — Prompts Controller
 * POST /prompts/create | POST /prompts/format | POST /prompts/validate
 * GET /prompts/templates | GET /prompts/templates/:name | POST /prompts/templates/custom
 * GET /prompts/examples | GET /prompts/examples/:category
 * POST /prompts/extract-variables | GET /prompts/cache/stats | POST /prompts/cache/clear
 */
describe('PromptsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...baseTestImports()],
      controllers: [PromptsController],
      providers: [
        { provide: PromptService, useValue: mockPromptService },
        { provide: PromptUtilsService, useValue: mockPromptUtilsService },
      ],
    }).compile();

    app = await createTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Réinitialiser les mocks essentiels
    mockPromptService.createPrompt.mockResolvedValue({
      prompt: 'Réponds à: {question}',
      type: 'RAG',
      variables: ['question'],
      template: 'Template RAG',
    });
    mockPromptService.formatPrompt.mockResolvedValue('Réponds à: Comment fonctionne le RAG ?');
    mockPromptService.validatePromptTemplate.mockReturnValue({ isValid: true, variables: ['question'], missingVariables: [], errors: [] });
    mockPromptService.getAllTemplates.mockReturnValue([
      { name: 'rag', type: 'RAG', description: 'Template RAG', variables: ['question', 'context'] },
    ]);
    mockPromptService.getTemplateByName.mockReturnValue({ name: 'rag', description: 'RAG', template: '{context}\n{question}', variables: ['context', 'question'], isSystem: true });
    mockPromptService.getCacheStats.mockReturnValue({ size: 5, hits: 12, misses: 3 });
    mockPromptService.clearCache.mockReturnValue(undefined);
    mockPromptUtilsService.extractVariables.mockReturnValue(['question', 'context']);
  });

  // ─── POST /prompts/create ────────────────────────────────────────────────────

  describe('POST /prompts/create', () => {
    it('✅ crée un prompt RAG avec succès', async () => {
      const res = await request(app.getHttpServer())
        .post('/prompts/create')
        .send({ type: 'RAG', includeFewShot: false })
        .expect(201);

      expect(res.body).toHaveProperty('prompt');
      expect(res.body).toHaveProperty('type');
      expect(res.body).toHaveProperty('variables');
      expect(mockPromptService.createPrompt).toHaveBeenCalledTimes(1);
    });

    it('✅ crée un prompt CONVERSATIONAL', async () => {
      await request(app.getHttpServer())
        .post('/prompts/create')
        .send({ type: 'CONVERSATIONAL' })
        .expect(201);

      expect(mockPromptService.createPrompt).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CONVERSATIONAL' })
      );
    });

    it('❌ retourne 400 si type est manquant', async () => {
      await request(app.getHttpServer())
        .post('/prompts/create')
        .send({ includeFewShot: true })
        .expect(400);
    });

    it('❌ retourne 400 si type est invalide', async () => {
      await request(app.getHttpServer())
        .post('/prompts/create')
        .send({ type: 'INVALID_TYPE' })
        .expect(400);
    });
  });

  // ─── POST /prompts/format ────────────────────────────────────────────────────

  describe('POST /prompts/format', () => {
    it('✅ formate un prompt avec les variables fournies', async () => {
      const res = await request(app.getHttpServer())
        .post('/prompts/format')
        .send({
          template: 'Réponds à cette question : {question}',
          variables: { question: 'Comment fonctionne le RAG ?' },
        })
        .expect(200);

      expect(res.body).toHaveProperty('formatted');
      expect(typeof res.body.formatted).toBe('string');
      expect(mockPromptService.formatPrompt).toHaveBeenCalledTimes(1);
    });

    it('✅ passe le bon template et les bonnes variables', async () => {
      await request(app.getHttpServer())
        .post('/prompts/format')
        .send({
          template: 'Bonjour {name}, tu as {age} ans.',
          variables: { name: 'Alice', age: '30' },
        })
        .expect(200);

      const calledDto = mockPromptService.formatPrompt.mock.calls[0][0];
      expect(calledDto.template).toBe('Bonjour {name}, tu as {age} ans.');
    });

    it('❌ retourne 400 si template est manquant', async () => {
      await request(app.getHttpServer())
        .post('/prompts/format')
        .send({ variables: { key: 'value' } })
        .expect(400);
    });
  });

  // ─── POST /prompts/validate ──────────────────────────────────────────────────

  describe('POST /prompts/validate', () => {
    it('✅ valide un template correct (isValid: true)', async () => {
      const res = await request(app.getHttpServer())
        .post('/prompts/validate')
        .send({
          template: 'Réponds à: {question}',
          requiredVariables: ['question'],
        })
        .expect(200);

      expect(res.body).toHaveProperty('isValid', true);
      expect(res.body).toHaveProperty('variables');
      expect(res.body).toHaveProperty('missingVariables');
      expect(mockPromptService.validatePromptTemplate).toHaveBeenCalledTimes(1);
    });

    it('✅ retourne isValid: false si des variables sont manquantes', async () => {
      mockPromptService.validatePromptTemplate.mockReturnValueOnce({
        isValid: false,
        variables: ['context'],
        missingVariables: ['question'],
        errors: ['Variable manquante: question'],
      });

      const res = await request(app.getHttpServer())
        .post('/prompts/validate')
        .send({
          template: 'Contexte: {context}',
          requiredVariables: ['context', 'question'],
        })
        .expect(200);

      expect(res.body.isValid).toBe(false);
      expect(res.body.missingVariables).toContain('question');
    });

    it('❌ retourne 400 si template est manquant', async () => {
      await request(app.getHttpServer())
        .post('/prompts/validate')
        .send({ requiredVariables: ['question'] })
        .expect(400);
    });
  });

  // ─── GET /prompts/templates ──────────────────────────────────────────────────

  describe('GET /prompts/templates', () => {
    it('✅ retourne la liste des templates système', async () => {
      const res = await request(app.getHttpServer())
        .get('/prompts/templates')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(mockPromptService.getAllTemplates).toHaveBeenCalledTimes(1);
    });

    it('✅ chaque template a un name et une description', async () => {
      const res = await request(app.getHttpServer())
        .get('/prompts/templates')
        .expect(200);

      res.body.forEach((template: any) => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
      });
    });
  });

  // ─── GET /prompts/templates/all ──────────────────────────────────────────────

  describe('GET /prompts/templates/all', () => {
    it('✅ retourne les templates système et custom', async () => {
      const res = await request(app.getHttpServer())
        .get('/prompts/templates/all')
        .expect(200);

      expect(res.body).toHaveProperty('system');
      expect(res.body).toHaveProperty('custom');
      expect(res.body).toHaveProperty('total');
      expect(mockPromptService.getAllTemplatesWithCustom).toHaveBeenCalledTimes(1);
    });
  });

  // ─── GET /prompts/templates/:name ────────────────────────────────────────────

  describe('GET /prompts/templates/:name', () => {
    it('✅ retourne un template par son nom', async () => {
      const res = await request(app.getHttpServer())
        .get('/prompts/templates/rag')
        .expect(200);

      expect(res.body).toHaveProperty('name', 'rag');
      expect(res.body).toHaveProperty('template');
      expect(mockPromptService.getTemplateByName).toHaveBeenCalledWith('rag');
    });
  });

  // ─── POST /prompts/templates/custom ──────────────────────────────────────────

  describe('POST /prompts/templates/custom', () => {
    it('✅ crée un template personnalisé', async () => {
      const res = await request(app.getHttpServer())
        .post('/prompts/templates/custom')
        .send({
          name: 'my-custom-template',
          description: 'Mon template personnalisé',
          template: 'Réponds en français : {question}',
        })
        .expect(201);

      expect(res.body).toHaveProperty('name', 'my-custom-template');
      expect(res.body).toHaveProperty('isSystem', false);
      expect(mockPromptService.createCustomTemplate).toHaveBeenCalledTimes(1);
    });

    it('❌ retourne 400 si name est manquant', async () => {
      await request(app.getHttpServer())
        .post('/prompts/templates/custom')
        .send({ description: 'Test', template: 'Template {var}' })
        .expect(400);
    });
  });

  // ─── GET /prompts/examples ───────────────────────────────────────────────────

  describe('GET /prompts/examples', () => {
    it('✅ retourne tous les exemples few-shot', async () => {
      const res = await request(app.getHttpServer())
        .get('/prompts/examples')
        .expect(200);

      expect(res.body).toBeDefined();
      expect(mockPromptService.getAllFewShotExamples).toHaveBeenCalledTimes(1);
    });
  });

  // ─── GET /prompts/examples/:category ─────────────────────────────────────────

  describe('GET /prompts/examples/:category', () => {
    it('✅ retourne les exemples pour la catégorie qa', async () => {
      const res = await request(app.getHttpServer())
        .get('/prompts/examples/qa')
        .expect(200);

      expect(res.body).toHaveProperty('category', 'qa');
      expect(res.body).toHaveProperty('examples');
      expect(Array.isArray(res.body.examples)).toBe(true);
      expect(mockPromptService.getFewShotExamples).toHaveBeenCalledWith('qa');
    });
  });

  // ─── POST /prompts/extract-variables ─────────────────────────────────────────

  describe('POST /prompts/extract-variables', () => {
    it('✅ extrait les variables d\'un template', async () => {
      const res = await request(app.getHttpServer())
        .post('/prompts/extract-variables')
        .send({ template: 'Réponds à {question} en utilisant {context}.' })
        .expect(200);

      expect(res.body).toHaveProperty('template');
      expect(res.body).toHaveProperty('variables');
      expect(Array.isArray(res.body.variables)).toBe(true);
      expect(res.body.variables).toContain('question');
      expect(mockPromptUtilsService.extractVariables).toHaveBeenCalledTimes(1);
    });
  });

  // ─── GET /prompts/cache/stats ─────────────────────────────────────────────────

  describe('GET /prompts/cache/stats', () => {
    it('✅ retourne les statistiques du cache', async () => {
      const res = await request(app.getHttpServer())
        .get('/prompts/cache/stats')
        .expect(200);

      expect(res.body).toHaveProperty('size');
      expect(res.body).toHaveProperty('hits');
      expect(res.body).toHaveProperty('misses');
      expect(mockPromptService.getCacheStats).toHaveBeenCalledTimes(1);
    });
  });

  // ─── POST /prompts/cache/clear ────────────────────────────────────────────────

  describe('POST /prompts/cache/clear', () => {
    it('✅ vide le cache avec succès', async () => {
      const res = await request(app.getHttpServer())
        .post('/prompts/cache/clear')
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(mockPromptService.clearCache).toHaveBeenCalledTimes(1);
    });
  });
});
