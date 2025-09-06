import { Module } from '@nestjs/common';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';
import { StockRepository } from './repositories/stock.repository';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { SymbolModule } from '../symbol/symbol.module';

@Module({
  imports: [SchedulerModule, SymbolModule],
  controllers: [StockController],
  providers: [StockService, StockRepository],
  exports: [StockService],
})
export class StockModule {}
