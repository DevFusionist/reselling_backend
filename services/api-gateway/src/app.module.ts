import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GatewayModule } from './gateway/gateway.module';
import { CacheModule } from './common/cache/cache.module';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      signOptions: { expiresIn: '15m' },
    }),
    CacheModule, // OPTIMIZATION: Redis caching for API Gateway
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy, RateLimitMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}

