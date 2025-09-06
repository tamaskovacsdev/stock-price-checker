import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SymbolRepository } from '../repositories/symbol.repository';
import { SymbolCacheService } from './symbol-cache.service';
import { FinnhubService } from '../../finnhub/services/finnhub.service';
import { SymbolConfig } from '@prisma/client';

@Injectable()
export class SymbolService {
  private readonly logger = new Logger(SymbolService.name);
  private readonly SYMBOL_REGEX = /^[A-Z]{1,5}$/;

  constructor(
    private readonly symbolRepository: SymbolRepository,
    private readonly symbolCache: SymbolCacheService,
    private readonly finnhubService: FinnhubService,
  ) {}

  validateSymbolFormat(symbol: string): void {
    if (!this.SYMBOL_REGEX.test(symbol)) {
      throw new BadRequestException(
        `Invalid symbol format: ${symbol}. Symbol must be 1-5 uppercase letters`,
      );
    }
  }

  async validateSymbolExists(symbol: string): Promise<boolean> {
    this.validateSymbolFormat(symbol);
    const upperSymbol = symbol.toUpperCase();

    // Check cache first
    const cached = await this.symbolCache.getCachedValidation(upperSymbol);
    if (cached !== null) {
      this.logger.debug(
        `Symbol ${upperSymbol} validation result from cache: ${cached}`,
      );
      return cached;
    }

    // Validate with external API
    const isValid = await this.finnhubService.validateSymbol(upperSymbol);

    // Cache the result
    await this.symbolCache.setCachedValidation(upperSymbol, isValid);

    return isValid;
  }

  async createSymbol(symbol: string): Promise<SymbolConfig> {
    this.validateSymbolFormat(symbol);
    const upperSymbol = symbol.toUpperCase();

    // Check if already exists
    const existing = await this.symbolRepository.findOne(upperSymbol);
    if (existing) {
      if (existing.isActive) {
        throw new ConflictException(
          `Symbol ${upperSymbol} is already being tracked`,
        );
      }
      // Reactivate if it was deactivated
      return this.symbolRepository.update(upperSymbol, { isActive: true });
    }

    // Validate with external API
    const isValid = await this.validateSymbolExists(upperSymbol);
    if (!isValid) {
      throw new NotFoundException(upperSymbol);
    }

    // Create new symbol config
    const symbolConfig = await this.symbolRepository.create({
      symbol: upperSymbol,
      isActive: true,
      checkInterval: 60000, // 1 minute default
    });

    // Invalidate cache
    await this.symbolCache.invalidateSymbol(upperSymbol);

    this.logger.log(`Created symbol configuration for ${upperSymbol}`);
    return symbolConfig;
  }

  async getSymbol(symbol: string): Promise<SymbolConfig> {
    this.validateSymbolFormat(symbol);
    const upperSymbol = symbol.toUpperCase();

    // Check cache
    const cached = await this.symbolCache.getCachedSymbol(upperSymbol);
    if (cached === false) {
      throw new NotFoundException(upperSymbol);
    }

    const symbolConfig = await this.symbolRepository.findOne(upperSymbol);
    if (!symbolConfig) {
      await this.symbolCache.setCachedSymbol(upperSymbol, false);
      throw new NotFoundException(upperSymbol);
    }

    await this.symbolCache.setCachedSymbol(upperSymbol, true);
    return symbolConfig;
  }

  async getActiveSymbols(): Promise<SymbolConfig[]> {
    return this.symbolRepository.findAll(true);
  }

  async getAllSymbols(): Promise<SymbolConfig[]> {
    return this.symbolRepository.findAll();
  }

  async updateSymbol(
    symbol: string,
    data: { isActive?: boolean; checkInterval?: number },
  ): Promise<SymbolConfig> {
    this.validateSymbolFormat(symbol);
    const upperSymbol = symbol.toUpperCase();

    const existing = await this.getSymbol(upperSymbol);
    if (!existing) {
      throw new NotFoundException(upperSymbol);
    }

    const updated = await this.symbolRepository.update(upperSymbol, data);

    // Invalidate cache
    await this.symbolCache.invalidateSymbol(upperSymbol);

    return updated;
  }

  async deactivateSymbol(symbol: string): Promise<SymbolConfig> {
    return this.updateSymbol(symbol, { isActive: false });
  }

  async updateLastChecked(symbol: string): Promise<void> {
    const upperSymbol = symbol.toUpperCase();
    await this.symbolRepository.updateLastChecked(upperSymbol);
  }

  async symbolExists(symbol: string): Promise<boolean> {
    this.validateSymbolFormat(symbol);
    return this.symbolRepository.exists(symbol.toUpperCase());
  }
}
