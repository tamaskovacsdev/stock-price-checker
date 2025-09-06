import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FinnhubService } from './services/finnhub.service';

@Module({
  imports: [ConfigModule],
  providers: [FinnhubService],
  exports: [FinnhubService],
})
export class FinnhubModule {}
