import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { CdnModule } from './common/cdn/cdn.module';
import { AppController } from './app.controller';
import { UserInfoMiddleware } from './common/middleware/user-info.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CacheModule, // OPTIMIZATION: Redis caching
    CdnModule, // OPTIMIZATION: CDN support for product images
    ProductsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserInfoMiddleware).forRoutes('*');
  }
}

