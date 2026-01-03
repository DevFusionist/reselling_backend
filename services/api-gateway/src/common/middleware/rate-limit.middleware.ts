import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit, { Store, ClientRateLimitInfo } from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Custom Redis store for rate limiting using ioredis
 * OPTIMIZATION: Enables distributed rate limiting across multiple gateway instances
 */
class RedisRateLimitStore implements Store {
  private client: Redis;
  private readonly keyPrefix = 'rl:';
  private readonly ttl = 15 * 60; // 15 minutes in seconds

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const count = await this.client.incr(fullKey);
      
      // Set TTL on first increment
      if (count === 1) {
        await this.client.expire(fullKey, this.ttl);
      }

      // Get remaining TTL
      const remainingTtl = await this.client.ttl(fullKey);
      const resetTime = new Date(Date.now() + (remainingTtl > 0 ? remainingTtl : this.ttl) * 1000);

      return {
        totalHits: count,
        resetTime,
      };
    } catch (error) {
      // On error, return 1 (minimum valid value) to avoid validation error
      console.error('Rate limit store error:', error);
      return {
        totalHits: 1,
        resetTime: new Date(Date.now() + this.ttl * 1000),
      };
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const count = await this.client.decr(fullKey);
      if (count <= 0) {
        await this.client.del(fullKey);
      }
    } catch (error) {
      // Ignore errors
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await this.client.del(`${this.keyPrefix}${key}`);
    } catch (error) {
      // Ignore errors
    }
  }

  async shutdown(): Promise<void> {
    await this.client.quit();
  }
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private limiter: ReturnType<typeof rateLimit>;

  constructor(private configService: ConfigService) {
    // OPTIMIZATION: Use Redis for distributed rate limiting (works across multiple gateway instances)
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    const store = new RedisRateLimitStore(redisUrl);

    this.limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(this.configService.get<string>('RATE_LIMIT_MAX') || '100', 10), // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      store: store, // Use Redis store for distributed rate limiting
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.limiter(req, res, next);
  }
}
