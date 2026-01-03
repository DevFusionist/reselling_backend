import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import * as http from 'http';
import * as https from 'https';
import { ShareLinksService } from './share-links.service';
import { ShareLinksController } from './share-links.controller';

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
  controllers: [ShareLinksController],
  providers: [ShareLinksService],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}

