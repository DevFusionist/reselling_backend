import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import * as http from 'http';
import * as https from 'https';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
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
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

