import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SymbolService } from '../../symbol/services/symbol.service';
import { FinnhubService } from '../../finnhub/services/finnhub.service';
import { StockRepository } from '../../stock/repositories/stock.repository';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly jobs = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly symbolService: SymbolService,
    private readonly finnhubService: FinnhubService,
    private readonly stockRepository: StockRepository,
  ) {}

  async startTracking(symbol: string): Promise<string> {
    const upperSymbol = symbol.toUpperCase();

    // Validate format
    this.symbolService.validateSymbolFormat(upperSymbol);

    // If already tracking, return existing job
    if (this.jobs.has(upperSymbol)) {
      this.logger.log(`Already tracking ${upperSymbol}`);
      return `${upperSymbol}-existing`;
    }

    // Create symbol if needed
    await this.symbolService.createSymbol(upperSymbol);

    // Start new job (every minute)
    const jobId = `${upperSymbol}-${Date.now()}`;
    const job = setInterval(() => {
      void this.fetchAndStorePrice(upperSymbol);
    }, 60000);

    this.jobs.set(upperSymbol, job);
    this.logger.log(`Started tracking ${upperSymbol}`);

    // Fetch initial price
    await this.fetchAndStorePrice(upperSymbol);

    return jobId;
  }

  stopTracking(symbol: string): void {
    const upperSymbol = symbol.toUpperCase();
    const job = this.jobs.get(upperSymbol);

    if (!job) {
      throw new NotFoundException(`No tracking job found for ${upperSymbol}`);
    }

    clearInterval(job);
    this.jobs.delete(upperSymbol);
    this.logger.log(`Stopped tracking ${upperSymbol}`);
  }

  getActiveSymbols(): string[] {
    return Array.from(this.jobs.keys());
  }

  getActiveJobsCount(): number {
    return this.jobs.size;
  }

  getJobStatus(symbol: string) {
    const upperSymbol = symbol.toUpperCase();
    const hasJob = this.jobs.has(upperSymbol);
    return hasJob ? { symbol: upperSymbol, status: 'ACTIVE' } : null;
  }

  getAllJobs() {
    return this.getActiveSymbols().map((symbol) => ({
      symbol,
      status: 'ACTIVE',
    }));
  }

  private async fetchAndStorePrice(symbol: string): Promise<void> {
    try {
      const quote = await this.finnhubService.getQuote(symbol);

      await this.stockRepository.create({
        price: quote.price,
        volume: quote.volume ? BigInt(quote.volume) : null,
        timestamp: quote.timestamp,
        symbolConfig: {
          connect: { symbol },
        },
      });

      await this.symbolService.updateLastChecked(symbol);
    } catch (error) {
      this.logger.error(`Failed to fetch price for ${symbol}:`, error);
    }
  }
}
