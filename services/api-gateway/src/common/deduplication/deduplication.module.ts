import { Module } from '@nestjs/common';
import { DeduplicationService } from './deduplication.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [DeduplicationService],
  exports: [DeduplicationService],
})
export class DeduplicationModule {}

