import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('APIGateway');
  
  const app = await NestFactory.create(AppModule, {
    logger: process.env.LOG_LEVEL 
      ? [process.env.LOG_LEVEL as any]
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

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

  // CORS Configuration
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5000';
  const allowedOrigins = corsOrigin === '*' 
    ? true // Allow all origins (but credentials must be false for this)
    : corsOrigin.split(',').map(s => s.trim());
  
  logger.log(`CORS Origin: ${corsOrigin}`);
  logger.log(`Allowed Origins: ${JSON.stringify(allowedOrigins)}`);
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: corsOrigin !== '*', // Disable credentials if wildcard is used
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Razorpay-Signature',
    ],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Enable shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 API Gateway is running on: http://localhost:${port}`);
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
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});

