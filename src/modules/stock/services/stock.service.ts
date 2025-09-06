import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StockRepository } from '../repositories/stock.repository';
import { SchedulerService } from '../../scheduler/services/scheduler.service';
import { SymbolService } from '../../symbol/services/symbol.service';
import { CacheService } from '../../cache/cache.service';
import { StockResponseDto } from '../dto/stock-response.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);
  private readonly PRICE_CACHE_PREFIX = 'stock:price:';
  private readonly PRICE_CACHE_TTL: number;

  constructor(
    private readonly stockRepository: StockRepository,
    private readonly schedulerService: SchedulerService,
    private readonly symbolService: SymbolService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.PRICE_CACHE_TTL =
      this.configService.get<number>('app.cache.ttl') || 30;
  }

  async startTracking(
    symbol: string,
  ): Promise<{ jobId: string; message: string }> {
    const upperSymbol = symbol.toUpperCase();

    // Validate symbol format
    this.symbolService.validateSymbolFormat(upperSymbol);

    // Start tracking (will create symbol if needed)
    const jobId = await this.schedulerService.startTracking(upperSymbol);

    return {
      jobId,
      message: `Started tracking ${upperSymbol}`,
    };
  }

  async getStockData(symbol: string): Promise<StockResponseDto> {
    const upperSymbol = symbol.toUpperCase();

    // Validate symbol format
    this.symbolService.validateSymbolFormat(upperSymbol);

    // Check cache first
    const cacheKey = `${this.PRICE_CACHE_PREFIX}${upperSymbol}`;
    const cached = await this.cacheService.get<StockResponseDto>(cacheKey);
    if (cached) {
      this.logger.debug(`Returning cached data for ${upperSymbol}`);
      return cached;
    }

    // Check if symbol is being tracked
    const symbolConfig = await this.symbolService
      .getSymbol(upperSymbol)
      .catch(() => null);
    if (!symbolConfig) {
      throw new NotFoundException(upperSymbol);
    }

    // Get latest price and calculate simple analytics
    const latestPrice = await this.stockRepository.findLatest(upperSymbol);
    if (!latestPrice) {
      throw new NotFoundException(
        `No data available for symbol ${upperSymbol}`,
      );
    }

    const movingAverage = await this.stockRepository.getMovingAverage(
      upperSymbol,
      10,
    );
    const priceHistory = await this.stockRepository.getLastNPrices(
      upperSymbol,
      10,
    );

    const response: StockResponseDto = {
      symbol: upperSymbol,
      currentPrice: Number(latestPrice.price.toString()),
      lastUpdated: latestPrice.timestamp,
      movingAverage: movingAverage || 0,
      priceHistory: priceHistory.map((p) => ({
        price: Number(p.price.toString()),
        timestamp: p.timestamp,
      })),
    };

    // Cache the response
    await this.cacheService.set(cacheKey, response, this.PRICE_CACHE_TTL);

    return response;
  }

  async getDetailedAnalytics(symbol: string) {
    const upperSymbol = symbol.toUpperCase();

    // Validate symbol format
    this.symbolService.validateSymbolFormat(upperSymbol);

    // Check if symbol is being tracked
    const symbolConfig = await this.symbolService
      .getSymbol(upperSymbol)
      .catch(() => null);
    if (!symbolConfig) {
      throw new NotFoundException(upperSymbol);
    }

    // Get latest price and calculate analytics
    const latestPrice = await this.stockRepository.findLatest(upperSymbol);
    if (!latestPrice) {
      throw new NotFoundException(
        `No data available for symbol ${upperSymbol}`,
      );
    }

    const movingAverage = await this.stockRepository.getMovingAverage(
      upperSymbol,
      10,
    );
    const priceHistory = await this.stockRepository.getLastNPrices(
      upperSymbol,
      10,
    );
    const jobStatus = this.schedulerService.getJobStatus(upperSymbol);

    return {
      symbol: upperSymbol,
      currentPrice: Number(latestPrice.price.toString()),
      movingAverage: movingAverage || 0,
      priceChange: 0, // Simple placeholder
      percentChange: 0, // Simple placeholder
      high24h: Number(latestPrice.price.toString()),
      low24h: Number(latestPrice.price.toString()),
      volume24h: Number(latestPrice.volume?.toString() || '0'),
      priceHistory: priceHistory.map((p) => ({
        price: Number(p.price.toString()),
        timestamp: p.timestamp,
      })),
      tracking: {
        isActive: symbolConfig.isActive,
        checkInterval: symbolConfig.checkInterval,
        lastChecked: symbolConfig.lastChecked,
        jobStatus: jobStatus?.status || 'UNKNOWN',
        errorCount: 0,
        lastError: null,
      },
    };
  }

  async stopTracking(symbol: string): Promise<{ message: string }> {
    const upperSymbol = symbol.toUpperCase();

    // Validate symbol format
    this.symbolService.validateSymbolFormat(upperSymbol);

    this.schedulerService.stopTracking(upperSymbol);

    // Clear cache
    const cacheKey = `${this.PRICE_CACHE_PREFIX}${upperSymbol}`;
    await this.cacheService.delete(cacheKey);

    return {
      message: `Stopped tracking ${upperSymbol}`,
    };
  }

  async getTrackedSymbols() {
    const symbols = await this.symbolService.getActiveSymbols();
    const jobs = this.schedulerService.getAllJobs();

    return symbols.map((symbol) => ({
      symbol: symbol.symbol,
      isActive: symbol.isActive,
      checkInterval: symbol.checkInterval,
      lastChecked: symbol.lastChecked,
      jobStatus:
        jobs.find((j) => j.symbol === symbol.symbol)?.status || 'UNKNOWN',
    }));
  }

  async getSystemStats() {
    const activeJobs = this.schedulerService.getActiveJobsCount();
    const totalSymbols = (await this.symbolService.getAllSymbols()).length;
    const totalPrices = await this.stockRepository.count();

    return {
      activeJobs,
      totalSymbols,
      totalPrices,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }
}
