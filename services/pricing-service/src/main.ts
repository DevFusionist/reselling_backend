// CRITICAL: Import Neon config FIRST before any Prisma/DB code
import './neon';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('PricingService');
  
  const app = await NestFactory.create(AppModule);

  // OPTIMIZATION: Response compression for faster network transfer
  app.use(compression({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
  }));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Enable shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  logger.log(`🚀 Pricing Service is running on: http://localhost:${port}`);
  logger.log(`📋 Health check: http://localhost:${port}/health`);
  
  // Signal PM2 that the app is ready
  if (process.send) {
    process.send('ready');
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
});

bootstrap().catch((error) => {
  console.error('Failed to start Pricing Service:', error);
  process.exit(1);
});

