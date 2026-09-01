import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('OmniDesk API')
    .setDescription('OmniDesk backend API')
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(swaggerDocument));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
