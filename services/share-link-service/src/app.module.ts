import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShareLinksModule } from './share-links/share-links.module';
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
    ShareLinksModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

