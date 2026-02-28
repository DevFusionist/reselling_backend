import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for Node.js environment
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // OPTIMIZATION: Query timeout in milliseconds (default: 30 seconds)
  private readonly queryTimeout = parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Prisma 7: Pass PoolConfig directly to PrismaNeon
    const adapter = new PrismaNeon({ connectionString });
    
    super({
      adapter,
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error', 'warn'],
      errorFormat: 'minimal',
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // OPTIMIZATION: Add query timeout middleware to prevent hanging queries
    // Must be called after $connect() to ensure PrismaClient is fully initialized
    if (typeof (this as any).$use === 'function') {
      (this as any).$use(async (params: any, next: any) => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Query timeout after ${this.queryTimeout}ms: ${params.model}.${params.action}`));
          }, this.queryTimeout);
        });

        try {
          const result = await Promise.race([next(params), timeoutPromise]);
          return result;
        } catch (error) {
          if (error instanceof Error && error.message.includes('timeout')) {
            throw new Error(`Database query timeout: ${error.message}`);
          }
          throw error;
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
