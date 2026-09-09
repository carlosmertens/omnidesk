import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import passport from 'passport';
import { Pool } from 'pg';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvVariables } from './config/env.validation.js';

// Shared between main.ts's real bootstrap and e2e test setup, so auth-guarded
// routes behave identically (session cookie + passport) in both. Returns the
// session store's pg.Pool so callers that tear down their own app (tests) can
// close it too — it isn't part of Nest's DI-managed lifecycle.
export function configureApp(app: INestApplication): Pool {
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

  return sessionPool;
}
