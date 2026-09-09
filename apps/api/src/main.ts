import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import passport from 'passport';
import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import type { EnvVariables } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService<EnvVariables, true>);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: configService.get('FRONTEND_URL', { infer: true }),
    credentials: true,
  });

  const PgSessionStore = connectPgSimple(session);
  const sessionPool = new Pool({
    connectionString: configService.get('DATABASE_URL', { infer: true }),
  });
  app.use(
    session({
      store: new PgSessionStore({ pool: sessionPool, tableName: 'session' }),
      secret: configService.get('SESSION_SECRET', { infer: true }),
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OmniDesk API')
    .setDescription('OmniDesk backend API')
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(swaggerDocument));

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);
  logger.log(`Listening on port ${port}`);
}
await bootstrap();
