import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HttpModule } from '@nestjs/axios';
import * as http from 'http';
import * as https from 'https';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { CacheModule } from '../common/cache/cache.module';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module';
import { DeduplicationModule } from '../common/deduplication/deduplication.module';

/**
 * Gateway Module - Central routing hub for all microservices
 * 
 * Uses RabbitMQ for message-based communication with services.
 * Default URLs use localhost for local development.
 */
@Module({
  imports: [
    CacheModule, // OPTIMIZATION: Redis caching for API Gateway
    CircuitBreakerModule, // OPTIMIZATION: Circuit breaker for fault tolerance
    DeduplicationModule, // OPTIMIZATION: Request deduplication
    HttpModule.register({
      timeout: 30000, // 30 seconds timeout
      maxRedirects: 5,
      // OPTIMIZATION: HTTP connection pooling for better performance
      httpAgent: new http.Agent({
        keepAlive: true,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 30000,
        keepAliveMsecs: 1000,
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: 50,
        maxFreeSockets: 10,
        timeout: 30000,
        keepAliveMsecs: 1000,
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'auth_queue',
            queueOptions: {
              durable: true,
            },
            socketOptions: {
              heartbeatIntervalInSeconds: 10,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PRODUCT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'product_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PRICING_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'pricing_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'ORDER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'order_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'PAYMENT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'payment_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'WALLET_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'wallet_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'SHARE_LINK_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'share_link_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'NOTIFICATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://admin:admin123@localhost:5672'],
            queue: 'notification_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
