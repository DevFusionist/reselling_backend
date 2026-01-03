import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import Redis from 'ioredis';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

        try {
          // Parse Redis URL to get connection options
          const redisUrlObj = new URL(redisUrl);
          const redisOptions: any = {
            host: redisUrlObj.hostname,
            port: parseInt(redisUrlObj.port || '6379', 10),
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
            enableReadyCheck: true,
            enableOfflineQueue: true,
          };

          // Add password if provided
          if (redisUrlObj.password) {
            redisOptions.password = redisUrlObj.password;
          }

          // Create Redis store with options
          const store = await redisStore({
            ...redisOptions,
            ttl: 300, // Default TTL: 5 minutes
          });

          // Test connection by creating a temporary client
          const testClient = new Redis(redisOptions);
          await testClient.ping();
          await testClient.quit();

          return {
            store: store,
            ttl: 300, // Default TTL: 5 minutes
            max: 5000, // Maximum number of items in cache
          };
        } catch (error: any) {
          console.warn('Failed to connect to Redis, falling back to memory store:', error.message);
          // Fallback to memory store if Redis fails
          return {
            ttl: 300, // Default TTL: 5 minutes
            max: 5000, // Maximum number of items in cache
          };
        }
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}

