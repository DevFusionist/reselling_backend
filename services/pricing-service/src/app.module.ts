import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PricingModule } from './pricing/pricing.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CacheModule, // OPTIMIZATION: Redis caching
    PricingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

