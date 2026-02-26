import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthModule } from '../src/modules/auth/auth.module';
import { createTestApp, baseTestImports, TEST_USER } from './helpers/app.helper';

/**
 * Tests e2e — Auth Controller
 * POST /auth/login
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...baseTestImports(), AuthModule],
    }).compile();

    app = await createTestApp(moduleFixture);
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /auth/login ────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('✅ retourne un access_token avec des credentials valides', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USER.username, password: TEST_USER.password })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('token_type', 'Bearer');
      expect(res.body).toHaveProperty('expires_in');
      expect(typeof res.body.access_token).toBe('string');
      expect(res.body.access_token.length).toBeGreaterThan(10);
    });

    it('❌ retourne 401 avec un mauvais mot de passe', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USER.username, password: 'wrong-password' })
        .expect(401);

      expect(res.body).toHaveProperty('statusCode', 401);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });

    it('❌ retourne 401 avec un utilisateur inexistant', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'unknown-user', password: 'any-password' })
        .expect(401);
    });

    it('❌ retourne 400 si username manquant', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: TEST_USER.password })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('❌ retourne 400 si password manquant', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USER.username })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('❌ retourne 400 si le body est vide', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('❌ retourne 400 si password trop court (< 6 chars)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USER.username, password: 'abc' })
        .expect(400);
    });

    it('❌ retourne 400 si propriété inconnue envoyée (forbidNonWhitelisted)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: TEST_USER.username, password: TEST_USER.password, role: 'admin' })
        .expect(400);
    });
  });
});
