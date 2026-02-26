import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AgentsController } from '../src/modules/agents/agents.controller';
import { AgentsService } from '../src/modules/agents/agents.service';
import { CustomToolService } from '../src/modules/agents/services/custom-tool.service';
import { createTestApp, baseTestImports } from './helpers/app.helper';

/**
 * Mocks des services Agents
 */
const mockAgentsService = {
  execute: jest.fn().mockResolvedValue({
    answer: 'Le résultat de (25 * 4) + (100 / 5) est 120.',
    steps: [
      {
        thought: 'Je dois calculer cette expression mathématique.',
        action: 'calculator',
        actionInput: '(25 * 4) + (100 / 5)',
        observation: '120',
      },
    ],
    metadata: {
      model: 'llama3.1:8b',
      tools: ['calculator'],
      iterations: 1,
      duration: 2500,
    },
  }),
  listAllTools: jest.fn().mockReturnValue({
    systemTools: [
      { name: 'calculator', description: 'Évalue des expressions mathématiques' },
      { name: 'datetime', description: 'Retourne la date et l\'heure actuelles' },
      { name: 'web_search', description: 'Effectue une recherche web' },
    ],
    customTools: [],
    totalCount: 3,
  }),
};

const mockCustomToolService = {
  registerTool: jest.fn(),
  deleteTool: jest.fn(),
  getCustomTools: jest.fn().mockReturnValue([]),
};

/**
 * Tests e2e — Agents Controller
 * POST /agents/execute | GET /agents/tools
 * POST /agents/tools/register | DELETE /agents/tools/:name
 */
describe('AgentsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...baseTestImports()],
      controllers: [AgentsController],
      providers: [
        { provide: AgentsService, useValue: mockAgentsService },
        { provide: CustomToolService, useValue: mockCustomToolService },
      ],
    }).compile();

    app = await createTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAgentsService.execute.mockResolvedValue({
      answer: 'Le résultat est 120.',
      steps: [{ thought: 'Calculons.', action: 'calculator', actionInput: '25*4', observation: '100' }],
      metadata: { model: 'llama3.1:8b', tools: ['calculator'], iterations: 1, duration: 2500 },
    });
    mockAgentsService.listAllTools.mockReturnValue({
      systemTools: [
        { name: 'calculator', description: 'Évalue des expressions mathématiques' },
        { name: 'datetime', description: 'Retourne la date/heure' },
        { name: 'web_search', description: 'Recherche web' },
      ],
      customTools: [],
      totalCount: 3,
    });
    mockCustomToolService.registerTool.mockReturnValue(undefined);
    mockCustomToolService.deleteTool.mockReturnValue(undefined);
  });

  // ─── POST /agents/execute ────────────────────────────────────────────────────

  describe('POST /agents/execute', () => {
    it('✅ exécute un agent avec le tool calculator', async () => {
      const res = await request(app.getHttpServer())
        .post('/agents/execute')
        .send({
          task: 'Calcule (25 * 4) + (100 / 5)',
          tools: ['calculator'],
          maxIterations: 3,
        })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('steps');
      expect(res.body).toHaveProperty('metadata');
      expect(Array.isArray(res.body.steps)).toBe(true);
      expect(mockAgentsService.execute).toHaveBeenCalledTimes(1);
    });

    it('✅ exécute avec le tool datetime', async () => {
      mockAgentsService.execute.mockResolvedValueOnce({
        answer: 'Nous sommes le 15 février 2026.',
        steps: [{ thought: 'Je vais utiliser datetime.', action: 'datetime', actionInput: 'now', observation: '2026-02-15' }],
        metadata: { model: 'llama3.1:8b', tools: ['datetime'], iterations: 1, duration: 800 },
      });

      const res = await request(app.getHttpServer())
        .post('/agents/execute')
        .send({
          task: 'Quelle est la date d\'aujourd\'hui ?',
          tools: ['datetime'],
        })
        .expect(200);

      expect(res.body.answer).toContain('2026');
    });

    it('✅ exécute avec plusieurs tools (multi-tool)', async () => {
      const res = await request(app.getHttpServer())
        .post('/agents/execute')
        .send({
          task: 'Quelle heure est-il et cherche des infos sur NestJS ?',
          tools: ['datetime', 'web_search'],
          maxIterations: 5,
        })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
    });

    it('✅ accepte un sessionId pour la mémoire conversationnelle', async () => {
      await request(app.getHttpServer())
        .post('/agents/execute')
        .send({
          task: 'Calcule 10 + 5',
          tools: ['calculator'],
          sessionId: 'user-session-001',
        })
        .expect(200);

      const calledDto = mockAgentsService.execute.mock.calls[0][0];
      expect(calledDto.sessionId).toBe('user-session-001');
    });

    it('✅ retourne les steps de raisonnement', async () => {
      const res = await request(app.getHttpServer())
        .post('/agents/execute')
        .send({ task: 'Calcule 2+2', tools: ['calculator'] })
        .expect(200);

      expect(res.body.steps.length).toBeGreaterThan(0);
      const step = res.body.steps[0];
      expect(step).toHaveProperty('thought');
      expect(step).toHaveProperty('action');
      expect(step).toHaveProperty('observation');
    });

    it('❌ retourne 400 si task est manquant', async () => {
      await request(app.getHttpServer())
        .post('/agents/execute')
        .send({ tools: ['calculator'] })
        .expect(400);
    });

    it('❌ retourne 400 si task est vide', async () => {
      await request(app.getHttpServer())
        .post('/agents/execute')
        .send({ task: '', tools: ['calculator'] })
        .expect(400);
    });

    it('❌ retourne 400 si tools est vide', async () => {
      await request(app.getHttpServer())
        .post('/agents/execute')
        .send({ task: 'Calcule quelque chose', tools: [] })
        .expect(400);
    });

    it('❌ retourne 400 si tools contient un tool invalide', async () => {
      await request(app.getHttpServer())
        .post('/agents/execute')
        .send({ task: 'Test', tools: ['invalid_tool_xyz'] })
        .expect(400);
    });

    it('❌ propage les erreurs du service (500)', async () => {
      mockAgentsService.execute.mockRejectedValueOnce(new Error('LLM timeout'));
      await request(app.getHttpServer())
        .post('/agents/execute')
        .send({ task: 'Calcule 1+1', tools: ['calculator'] })
        .expect(500);
    });
  });

  // ─── GET /agents/tools ───────────────────────────────────────────────────────

  describe('GET /agents/tools', () => {
    it('✅ liste tous les tools disponibles (système + custom)', async () => {
      const res = await request(app.getHttpServer())
        .get('/agents/tools')
        .expect(200);

      expect(res.body).toHaveProperty('systemTools');
      expect(res.body).toHaveProperty('customTools');
      expect(res.body).toHaveProperty('totalCount');
      expect(Array.isArray(res.body.systemTools)).toBe(true);
      expect(Array.isArray(res.body.customTools)).toBe(true);
      expect(mockAgentsService.listAllTools).toHaveBeenCalledTimes(1);
    });

    it('✅ inclut les tools système par défaut', async () => {
      const res = await request(app.getHttpServer())
        .get('/agents/tools')
        .expect(200);

      const toolNames = res.body.systemTools.map((t: any) => t.name);
      expect(toolNames).toContain('calculator');
      expect(toolNames).toContain('datetime');
      expect(toolNames).toContain('web_search');
    });

    it('✅ totalCount reflète le nombre total de tools', async () => {
      const res = await request(app.getHttpServer())
        .get('/agents/tools')
        .expect(200);

      const expected = res.body.systemTools.length + res.body.customTools.length;
      expect(res.body.totalCount).toBe(expected);
    });
  });

  // ─── POST /agents/tools/register ─────────────────────────────────────────────

  describe('POST /agents/tools/register', () => {
    const validTool = {
      name: 'joke_api',
      description: 'Récupère une blague aléatoire',
      endpoint: 'https://official-joke-api.appspot.com/random_joke',
      method: 'GET',
      responseTemplate: '{setup} - {punchline}',
    };

    it('✅ enregistre un custom tool HTTP avec succès', async () => {
      const res = await request(app.getHttpServer())
        .post('/agents/tools/register')
        .send(validTool)
        .expect(201);

      expect(res.body).toHaveProperty('name', 'joke_api');
      expect(res.body).toHaveProperty('status', 'registered');
      expect(res.body).toHaveProperty('message');
      expect(mockCustomToolService.registerTool).toHaveBeenCalledTimes(1);
    });

    it('✅ enregistre un tool avec headers personnalisés', async () => {
      const toolWithHeaders = {
        ...validTool,
        name: 'weather_api',
        description: 'Récupère la météo',
        endpoint: 'https://api.weather.com/v1/current',
        headers: { 'Accept': 'application/json', 'Authorization': 'Bearer test' },
      };

      const res = await request(app.getHttpServer())
        .post('/agents/tools/register')
        .send(toolWithHeaders)
        .expect(201);

      expect(res.body.name).toBe('weather_api');
    });

    it('❌ retourne 400 si name est manquant', async () => {
      const { name, ...toolWithoutName } = validTool;
      await request(app.getHttpServer())
        .post('/agents/tools/register')
        .send(toolWithoutName)
        .expect(400);
    });

    it('❌ retourne 400 si endpoint est manquant', async () => {
      const { endpoint, ...toolWithoutEndpoint } = validTool;
      await request(app.getHttpServer())
        .post('/agents/tools/register')
        .send(toolWithoutEndpoint)
        .expect(400);
    });

    it('❌ retourne 400 si description est manquante', async () => {
      const { description, ...toolWithoutDesc } = validTool;
      await request(app.getHttpServer())
        .post('/agents/tools/register')
        .send(toolWithoutDesc)
        .expect(400);
    });
  });

  // ─── DELETE /agents/tools/:name ──────────────────────────────────────────────

  describe('DELETE /agents/tools/:name', () => {
    it('✅ supprime un custom tool par son nom', async () => {
      const res = await request(app.getHttpServer())
        .delete('/agents/tools/joke_api')
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('name', 'joke_api');
      expect(mockCustomToolService.deleteTool).toHaveBeenCalledWith('joke_api');
    });

    it('✅ retourne le nom du tool supprimé dans la réponse', async () => {
      const toolName = 'my_custom_tool';
      const res = await request(app.getHttpServer())
        .delete(`/agents/tools/${toolName}`)
        .expect(200);

      expect(res.body.name).toBe(toolName);
    });
  });
});
