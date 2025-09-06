import { Module } from '@nestjs/common';
import { SchedulerService } from './services/scheduler.service';
import { SymbolModule } from '../symbol/symbol.module';
import { FinnhubModule } from '../finnhub/finnhub.module';
import { StockRepository } from '../stock/repositories/stock.repository';

@Module({
  imports: [SymbolModule, FinnhubModule],
  providers: [SchedulerService, StockRepository],
  exports: [SchedulerService],
})
export class SchedulerModule {}
