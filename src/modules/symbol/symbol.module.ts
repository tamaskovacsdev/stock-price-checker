import { Module } from '@nestjs/common';
import { SymbolService } from './services/symbol.service';
import { SymbolCacheService } from './services/symbol-cache.service';
import { SymbolRepository } from './repositories/symbol.repository';
import { FinnhubModule } from '../finnhub/finnhub.module';

@Module({
  imports: [FinnhubModule],
  providers: [SymbolService, SymbolCacheService, SymbolRepository],
  exports: [SymbolService],
})
export class SymbolModule {}
