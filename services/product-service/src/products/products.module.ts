import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}

// Note: RolesGuard requires JWT validation from API Gateway
// In production, API Gateway will validate JWT and pass user info in headers

