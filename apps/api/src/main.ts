import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';
import type { EnvVariables } from './config/env.validation.js';
import { configureApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService<EnvVariables, true>);

  configureApp(app);

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
