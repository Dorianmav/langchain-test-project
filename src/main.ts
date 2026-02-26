import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const nodeEnv = process.env.NODE_ENV || 'development';

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: nodeEnv === 'production' ? undefined : false,
    }),
  );

  // CORS Configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3001', 'http://localhost:3000'];

  app.enableCors({
    origin: nodeEnv === 'production' ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 3600,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';

  // Force HTTPS en production
  if (nodeEnv === 'production') {
    app.use((req, res, next) => {
      if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect(301, 'https://' + req.get('host') + req.url);
      }
      next();
    });
  }

  // Configuration Swagger (seulement si activé)
  if (swaggerEnabled && nodeEnv !== 'production') {
    // Protection par authentification basique
    const swaggerUsername = process.env.SWAGGER_USERNAME || 'admin';
    const swaggerPassword = process.env.SWAGGER_PASSWORD || 'changeme';

    app.use(
      ['/api'],
      expressBasicAuth({
        challenge: true,
        users: { [swaggerUsername]: swaggerPassword },
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('LangChain RAG API')
      .setDescription('API pour le projet LangChain avec RAG, LLM et Vector Stores')
      .setVersion('1.0')
      .addServer(`http://localhost:${port}`, 'Local (dev direct)')
      .addServer('http://localhost:3001', 'Local (Docker)')
      .addTag('llm', 'Endpoints pour les Large Language Models (Ollama, Groq)')
      .addTag('rag', 'Endpoints pour Retrieval Augmented Generation')
      .addTag('search', 'Endpoints pour la recherche web (DuckDuckGo, Tavily)')
      .addTag('embeddings', 'Endpoints pour les embeddings et vectorisation')
      .addTag('vector-store', 'Endpoints pour les bases vectorielles (Chroma, Qdrant)')
      .addTag('audit', 'Endpoints pour l\'audit et la traçabilité')
      .addBearerAuth() // Pour future authentification JWT
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    console.log(`\n🔒 Swagger protégé - Username: ${swaggerUsername}`);
    console.log(`📚 Documentation Swagger: http://localhost:${port}/api`);
  } else if (nodeEnv === 'production') {
    console.log(`\n🔒 Swagger désactivé en production pour des raisons de sécurité`);
  } else {
    console.log(`\n📚 Swagger désactivé (SWAGGER_ENABLED=${swaggerEnabled})`);
  }

  const reflector = app.get(Reflector);

  if (nodeEnv === 'production') {
    app.useGlobalGuards(new JwtAuthGuard(reflector));
    console.log('🔐 Auth activée');
  } else {
    console.log('⚡ Auth désactivée en dev');
  }

  await app.listen(port);

  console.log(`\n🚀 Application démarrée sur: http://localhost:${port}`);
  console.log(`🌍 Environnement: ${nodeEnv}\n`);
}
bootstrap();
