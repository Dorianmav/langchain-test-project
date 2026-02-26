import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';

export const TEST_JWT_SECRET = 'test-secret-key-for-jest';
export const TEST_USER = { username: 'admin', password: 'changeme' };
export const TEST_JWT_TOKEN = 'test-bearer-token';

/**
 * Génère un vrai JWT signé pour les tests
 */
export function generateTestToken(payload: Record<string, any> = {}): string {
  const jwtService = new JwtService({ secret: TEST_JWT_SECRET });
  return jwtService.sign({ sub: 'admin', username: 'admin', ...payload });
}

/**
 * Configure une application NestJS de test avec les pipes globaux
 */
export async function createTestApp(
  moduleBuilder: TestingModule,
): Promise<INestApplication> {
  const app = moduleBuilder.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

/**
 * Crée un module de test minimal avec ConfigModule + JwtModule préconfigurés
 */
export function baseTestImports() {
  return [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
      ignoreEnvFile: true,
      load: [
        () => ({
          JWT_SECRET: TEST_JWT_SECRET,
          JWT_EXPIRES_IN: '1h',
          API_USERNAME: TEST_USER.username,
          API_PASSWORD: TEST_USER.password,
          NODE_ENV: 'test',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
          REDIS_TLS_ENABLED: 'false',
        }),
      ],
    }),
    JwtModule.register({
      secret: TEST_JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ];
}
