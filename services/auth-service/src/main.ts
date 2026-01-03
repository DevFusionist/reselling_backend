// CRITICAL: Import Neon config FIRST before any Prisma/DB code
import './neon';

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AuthService');
  
  try {
    const app = await NestFactory.create(AppModule);

    // OPTIMIZATION: Response compression for faster network transfer
    app.use(compression({
      level: 6,
      threshold: 1024, // Only compress responses > 1KB
    }));

    // Enable CORS
    app.enableCors();

    // Enable validation for HTTP only (microservices handle validation separately)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        skipMissingProperties: false,
        forbidNonWhitelisted: false,
      }),
    );

    // Enable shutdown hooks for graceful shutdown
    app.enableShutdownHooks();

    // Use localhost as default for local development
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672';
    logger.log(`Connecting to RabbitMQ at: ${rabbitmqUrl.replace(/:[^:@]+@/, ':****@')}`);

    // Connect to RabbitMQ as a microservice
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'auth_queue',
        queueOptions: {
          durable: true,
        },
        // Use noAck: true for RPC pattern to avoid blocking on stale messages
        // The RPC pattern inherently provides reliability through timeouts
        noAck: true,
        socketOptions: {
          heartbeatIntervalInSeconds: 10,
          reconnectTimeInSeconds: 5,
        },
      },
    });

    // Start all microservices
    try {
      await app.startAllMicroservices();
      logger.log('✅ Microservice is listening on RabbitMQ queue: auth_queue');
    } catch (error) {
      logger.error('❌ Failed to start microservice:', error);
      throw error;
    }

    // Start HTTP server (for health checks)
    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 HTTP server is running on: http://localhost:${port}`);
    logger.log(`📋 Health check: http://localhost:${port}/health`);
    
    // Signal PM2 that the app is ready
    if (process.send) {
      process.send('ready');
    }
  } catch (error) {
    logger.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
});

bootstrap();
