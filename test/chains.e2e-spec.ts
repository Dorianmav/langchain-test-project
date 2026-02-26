import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ChainsController } from '../src/modules/chains/chains.controller';
import { ChainsService } from '../src/modules/chains/chains.service';
import { RetrievalQAService } from '../src/modules/chains/services/retrieval-qa.service';
import { ConversationalRetrievalService } from '../src/modules/chains/services/conversational-retrieval.service';
import { createTestApp, baseTestImports } from './helpers/app.helper';

/**
 * Mocks des services Chains
 */
const mockChainsService = {
  simpleChain: jest.fn().mockResolvedValue({
    result: 'Bonjour, cher client ! Nous sommes ravis de vous accueillir.',
    template: 'Écris une salutation {tone} pour {recipient}.',
    variables: { tone: 'professionnelle', recipient: 'un client' },
    cached: false,
    metadata: { model: 'llama3.1:8b', provider: 'ollama', duration: 1200 },
  }),
  sequentialChain: jest.fn().mockResolvedValue({
    finalOutput: 'Voici une histoire de science-fiction captivante...',
    steps: [
      { name: 'topic', output: 'Un voyage interstellaire', inputVariables: ['theme'], outputKey: 'story_topic' },
      { name: 'plot', output: 'Des astronautes découvrent une planète inconnue', inputVariables: ['story_topic'], outputKey: 'plot' },
    ],
    metadata: { totalSteps: 2, duration: 3000 },
  }),
};

const mockRetrievalQAService = {
  retrievalQA: jest.fn().mockResolvedValue({
    answer: 'LangChain est un framework pour créer des applications basées sur LLM.',
    sourceDocuments: [
      { pageContent: 'LangChain est un framework...', metadata: { source: 'doc1.txt' } },
    ],
    metadata: { model: 'llama3.1:8b', chainType: 'STUFF', duration: 2000 },
  }),
};

const mockConversationalRetrievalService = {
  conversationalRetrieval: jest.fn().mockResolvedValue({
    answer: 'Pour l\'utiliser avec NestJS, installez le package @langchain/core...',
    sessionId: 'test-session',
    sourceDocuments: [],
    metadata: { model: 'llama3.1:8b', duration: 1500 },
  }),
  clearSessionMemory: jest.fn().mockResolvedValue(undefined),
};

/**
 * Tests e2e — Chains Controller
 * POST /chains/simple | /chains/sequential | /chains/retrieval-qa | /chains/conversational
 * DELETE /chains/memory/:sessionId
 */
describe('ChainsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...baseTestImports()],
      controllers: [ChainsController],
      providers: [
        { provide: ChainsService, useValue: mockChainsService },
        { provide: RetrievalQAService, useValue: mockRetrievalQAService },
        { provide: ConversationalRetrievalService, useValue: mockConversationalRetrievalService },
      ],
    }).compile();

    app = await createTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockChainsService.simpleChain.mockResolvedValue({
      result: 'Bonjour, cher client !',
      template: 'Écris une salutation {tone} pour {recipient}.',
      variables: { tone: 'professionnelle', recipient: 'un client' },
      cached: false,
      metadata: { model: 'llama3.1:8b', provider: 'ollama', duration: 1200 },
    });
    mockChainsService.sequentialChain.mockResolvedValue({
      finalOutput: 'Une histoire de science-fiction...',
      steps: [],
      metadata: { totalSteps: 2, duration: 3000 },
    });
    mockRetrievalQAService.retrievalQA.mockResolvedValue({
      answer: 'LangChain est un framework.',
      sourceDocuments: [],
      metadata: { model: 'llama3.1:8b', chainType: 'STUFF', duration: 2000 },
    });
    mockConversationalRetrievalService.conversationalRetrieval.mockResolvedValue({
      answer: 'Installez @langchain/core...',
      sessionId: 'test-session',
      sourceDocuments: [],
      metadata: { model: 'llama3.1:8b', duration: 1500 },
    });
    mockConversationalRetrievalService.clearSessionMemory.mockResolvedValue(undefined);
  });

  // ─── POST /chains/simple ─────────────────────────────────────────────────────

  describe('POST /chains/simple', () => {
    it('✅ exécute une simple chain avec template et variables', async () => {
      const res = await request(app.getHttpServer())
        .post('/chains/simple')
        .send({
          template: 'Écris une salutation {tone} pour {recipient}.',
          variables: { tone: 'professionnelle', recipient: 'un client' },
          temperature: 0.7,
        })
        .expect(200);

      expect(res.body).toHaveProperty('result');
      expect(res.body).toHaveProperty('metadata');
      expect(mockChainsService.simpleChain).toHaveBeenCalledTimes(1);
    });

    it('✅ exécute une simple chain sans variables (champ optionnel)', async () => {
      const res = await request(app.getHttpServer())
        .post('/chains/simple')
        .send({
          template: 'Donne-moi un conseil du jour.',
        })
        .expect(200);

      expect(res.body).toHaveProperty('result');
      expect(mockChainsService.simpleChain).toHaveBeenCalledTimes(1);
    });

    it('✅ exécute avec une temperature personnalisée', async () => {
      await request(app.getHttpServer())
        .post('/chains/simple')
        .send({
          template: 'Génère un haiku sur {subject}.',
          variables: { subject: 'le printemps' },
          temperature: 0.9,
        })
        .expect(200);

      const calledDto = mockChainsService.simpleChain.mock.calls[0][0];
      expect(calledDto.temperature).toBe(0.9);
    });

    it('❌ retourne 400 si le template est manquant', async () => {
      await request(app.getHttpServer())
        .post('/chains/simple')
        .send({ variables: { key: 'value' } })
        .expect(400);
    });

    it('❌ retourne 400 si le template est vide', async () => {
      await request(app.getHttpServer())
        .post('/chains/simple')
        .send({ template: '' })
        .expect(400);
    });

    it('❌ retourne 400 si variables n\'est pas un objet', async () => {
      await request(app.getHttpServer())
        .post('/chains/simple')
        .send({ template: 'Hello {name}', variables: 'invalid' })
        .expect(400);
    });

    it('❌ propage les erreurs du service (500)', async () => {
      mockChainsService.simpleChain.mockRejectedValueOnce(new Error('LLM unavailable'));
      await request(app.getHttpServer())
        .post('/chains/simple')
        .send({ template: 'Test' })
        .expect(500);
    });
  });

  // ─── POST /chains/sequential ─────────────────────────────────────────────────

  describe('POST /chains/sequential', () => {
    const validPayload = {
      steps: [
        {
          name: 'topic',
          template: 'Propose un sujet sur {theme}',
          inputVariables: ['theme'],
          outputKey: 'story_topic',
        },
        {
          name: 'story',
          template: 'Écris une histoire sur: {story_topic}',
          inputVariables: ['story_topic'],
          outputKey: 'final_story',
        },
      ],
      initialVariables: { theme: 'aventure' },
    };

    it('✅ exécute une sequential chain avec steps et initialVariables', async () => {
      const res = await request(app.getHttpServer())
        .post('/chains/sequential')
        .send(validPayload)
        .expect(200);

      expect(res.body).toHaveProperty('finalOutput');
      expect(mockChainsService.sequentialChain).toHaveBeenCalledTimes(1);
    });

    it('✅ exécute sans initialVariables (champ optionnel)', async () => {
      const { initialVariables, ...payloadWithoutInitial } = validPayload;
      const res = await request(app.getHttpServer())
        .post('/chains/sequential')
        .send(payloadWithoutInitial)
        .expect(200);

      expect(res.body).toHaveProperty('finalOutput');
    });

    it('❌ retourne 400 si steps est manquant', async () => {
      await request(app.getHttpServer())
        .post('/chains/sequential')
        .send({ initialVariables: { theme: 'test' } })
        .expect(400);
    });

    it('❌ retourne 400 si steps est vide', async () => {
      await request(app.getHttpServer())
        .post('/chains/sequential')
        .send({ steps: [] })
        .expect(400);
    });

    it('❌ retourne 400 si initialVariables n\'est pas un objet', async () => {
      await request(app.getHttpServer())
        .post('/chains/sequential')
        .send({ steps: validPayload.steps, initialVariables: 'not-an-object' })
        .expect(400);
    });
  });

  // ─── POST /chains/retrieval-qa ───────────────────────────────────────────────

  describe('POST /chains/retrieval-qa', () => {
    it('✅ retourne une réponse avec sources pour une question valide', async () => {
      const res = await request(app.getHttpServer())
        .post('/chains/retrieval-qa')
        .send({
          question: 'Qu\'est-ce que LangChain ?',
          topK: 4,
          chainType: 'STUFF',
          returnSourceDocuments: true,
        })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('metadata');
      expect(mockRetrievalQAService.retrievalQA).toHaveBeenCalledTimes(1);
    });

    it('✅ fonctionne avec chainType MAP_REDUCE', async () => {
      await request(app.getHttpServer())
        .post('/chains/retrieval-qa')
        .send({ question: 'Explique le RAG', chainType: 'MAP_REDUCE' })
        .expect(200);
    });

    it('❌ retourne 400 si question est manquante', async () => {
      await request(app.getHttpServer())
        .post('/chains/retrieval-qa')
        .send({ topK: 4 })
        .expect(400);
    });
  });

  // ─── POST /chains/conversational ─────────────────────────────────────────────

  describe('POST /chains/conversational', () => {
    it('✅ retourne une réponse conversationnelle avec sessionId', async () => {
      const res = await request(app.getHttpServer())
        .post('/chains/conversational')
        .send({
          sessionId: 'test-session-001',
          question: 'Comment utiliser LangChain avec NestJS ?',
          topK: 4,
        })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('sessionId');
      expect(mockConversationalRetrievalService.conversationalRetrieval).toHaveBeenCalledTimes(1);
    });

    it('❌ retourne 400 si question est manquante', async () => {
      await request(app.getHttpServer())
        .post('/chains/conversational')
        .send({ sessionId: 'test-session' })
        .expect(400);
    });

    it('❌ retourne 400 si sessionId est manquant', async () => {
      await request(app.getHttpServer())
        .post('/chains/conversational')
        .send({ question: 'test?' })
        .expect(400);
    });
  });

  // ─── DELETE /chains/memory/:sessionId ────────────────────────────────────────

  describe('DELETE /chains/memory/:sessionId', () => {
    it('✅ supprime la mémoire de session avec succès', async () => {
      const res = await request(app.getHttpServer())
        .delete('/chains/memory/test-session-001')
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('sessionId', 'test-session-001');
      expect(mockConversationalRetrievalService.clearSessionMemory).toHaveBeenCalledWith('test-session-001');
    });

    it('✅ retourne le bon sessionId dans la réponse', async () => {
      const sessionId = 'user-abc-123';
      const res = await request(app.getHttpServer())
        .delete(`/chains/memory/${sessionId}`)
        .expect(200);

      expect(res.body.sessionId).toBe(sessionId);
    });
  });
});
