import { Injectable } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class SymbolCacheService {
  private readonly CACHE_PREFIX = 'symbol:';
  private readonly VALIDATION_PREFIX = 'symbol:valid:';
  private readonly VALIDATION_TTL = 3600; // 1 hour

  constructor(private readonly cacheService: CacheService) {}

  async getCachedSymbol(symbol: string): Promise<boolean | null> {
    const key = `${this.CACHE_PREFIX}${symbol.toUpperCase()}`;
    return this.cacheService.get<boolean>(key);
  }

  async setCachedSymbol(symbol: string, exists: boolean): Promise<void> {
    const key = `${this.CACHE_PREFIX}${symbol.toUpperCase()}`;
    await this.cacheService.set(key, exists, 300); // Cache for 5 minutes
  }

  async getCachedValidation(symbol: string): Promise<boolean | null> {
    const key = `${this.VALIDATION_PREFIX}${symbol.toUpperCase()}`;
    return this.cacheService.get<boolean>(key);
  }

  async setCachedValidation(symbol: string, isValid: boolean): Promise<void> {
    const key = `${this.VALIDATION_PREFIX}${symbol.toUpperCase()}`;
    await this.cacheService.set(key, isValid, this.VALIDATION_TTL);
  }

  async invalidateSymbol(symbol: string): Promise<void> {
    const keys = [
      `${this.CACHE_PREFIX}${symbol.toUpperCase()}`,
      `${this.VALIDATION_PREFIX}${symbol.toUpperCase()}`,
    ];

    for (const key of keys) {
      await this.cacheService.delete(key);
    }
  }

  invalidateAll(): void {
    // For simplicity, we'll just skip this method
    // In a real app, you could track cached keys or use Redis SCAN
    console.debug('InvalidateAll not implemented in simplified cache');
  }
}
