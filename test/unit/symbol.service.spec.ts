import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SymbolService } from '../../src/modules/symbol/services/symbol.service';
import { SymbolRepository } from '../../src/modules/symbol/repositories/symbol.repository';
import { SymbolCacheService } from '../../src/modules/symbol/services/symbol-cache.service';
import { FinnhubService } from '../../src/modules/finnhub/services/finnhub.service';

describe('SymbolService', () => {
  let service: SymbolService;
  let symbolRepository: jest.Mocked<SymbolRepository>;
  let symbolCache: jest.Mocked<SymbolCacheService>;
  let finnhubService: jest.Mocked<FinnhubService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SymbolService,
        {
          provide: SymbolRepository,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            updateLastChecked: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: SymbolCacheService,
          useValue: {
            getCachedSymbol: jest.fn(),
            setCachedSymbol: jest.fn(),
            getCachedValidation: jest.fn(),
            setCachedValidation: jest.fn(),
            invalidateSymbol: jest.fn(),
          },
        },
        {
          provide: FinnhubService,
          useValue: {
            validateSymbol: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SymbolService>(SymbolService);
    symbolRepository = module.get(SymbolRepository);
    symbolCache = module.get(SymbolCacheService);
    finnhubService = module.get(FinnhubService);
  });

  describe('validateSymbolFormat', () => {
    it('should validate correct symbol format', () => {
      expect(() => service.validateSymbolFormat('AAPL')).not.toThrow();
      expect(() => service.validateSymbolFormat('A')).not.toThrow();
      expect(() => service.validateSymbolFormat('GOOGL')).not.toThrow();
    });

    it('should throw BadRequestException for invalid format', () => {
      expect(() => service.validateSymbolFormat('aapl')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateSymbolFormat('AAPPLE')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateSymbolFormat('123')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateSymbolFormat('')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateSymbolExists', () => {
    it('should return true for valid symbol from cache', async () => {
      symbolCache.getCachedValidation.mockResolvedValue(true);

      const result = await service.validateSymbolExists('AAPL');

      expect(result).toBe(true);
      expect(symbolCache.getCachedValidation).toHaveBeenCalledWith('AAPL');
      expect(finnhubService.validateSymbol).not.toHaveBeenCalled();
    });

    it('should validate with Finnhub when not cached', async () => {
      symbolCache.getCachedValidation.mockResolvedValue(null);
      finnhubService.validateSymbol.mockResolvedValue(true);

      const result = await service.validateSymbolExists('AAPL');

      expect(result).toBe(true);
      expect(finnhubService.validateSymbol).toHaveBeenCalledWith('AAPL');
      expect(symbolCache.setCachedValidation).toHaveBeenCalledWith(
        'AAPL',
        true,
      );
    });

    it('should throw BadRequestException for invalid format', async () => {
      await expect(service.validateSymbolExists('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createSymbol', () => {
    it('should create new symbol configuration', async () => {
      const symbolConfig = {
        symbol: 'AAPL',
        isActive: true,
        checkInterval: 60000,
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      symbolRepository.findOne.mockResolvedValue(null);
      finnhubService.validateSymbol.mockResolvedValue(true);
      symbolCache.getCachedValidation.mockResolvedValue(null);
      symbolRepository.create.mockResolvedValue(symbolConfig);

      const result = await service.createSymbol('AAPL');

      expect(result).toEqual(symbolConfig);
      expect(symbolRepository.create).toHaveBeenCalledWith({
        symbol: 'AAPL',
        isActive: true,
        checkInterval: 60000,
      });
      expect(symbolCache.invalidateSymbol).toHaveBeenCalledWith('AAPL');
    });

    it('should reactivate existing inactive symbol', async () => {
      const existingSymbol = {
        symbol: 'AAPL',
        isActive: false,
        checkInterval: 60000,
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedSymbol = { ...existingSymbol, isActive: true };

      symbolRepository.findOne.mockResolvedValue(existingSymbol);
      symbolRepository.update.mockResolvedValue(updatedSymbol);

      const result = await service.createSymbol('AAPL');

      expect(result).toEqual(updatedSymbol);
      expect(symbolRepository.update).toHaveBeenCalledWith('AAPL', {
        isActive: true,
      });
    });

    it('should throw ConflictException for active symbol', async () => {
      const existingSymbol = {
        symbol: 'AAPL',
        isActive: true,
        checkInterval: 60000,
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      symbolRepository.findOne.mockResolvedValue(existingSymbol);

      await expect(service.createSymbol('AAPL')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException for invalid symbol', async () => {
      symbolRepository.findOne.mockResolvedValue(null);
      finnhubService.validateSymbol.mockResolvedValue(false);
      symbolCache.getCachedValidation.mockResolvedValue(null);

      await expect(service.createSymbol('XXXXX')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSymbol', () => {
    it('should return symbol configuration', async () => {
      const symbolConfig = {
        symbol: 'AAPL',
        isActive: true,
        checkInterval: 60000,
        lastChecked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      symbolCache.getCachedSymbol.mockResolvedValue(null);
      symbolRepository.findOne.mockResolvedValue(symbolConfig);

      const result = await service.getSymbol('AAPL');

      expect(result).toEqual(symbolConfig);
      expect(symbolCache.setCachedSymbol).toHaveBeenCalledWith('AAPL', true);
    });

    it('should throw NotFoundException when symbol not found', async () => {
      symbolCache.getCachedSymbol.mockResolvedValue(false);

      await expect(service.getSymbol('XXXXX')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getActiveSymbols', () => {
    it('should return active symbols', async () => {
      const activeSymbols = [
        {
          symbol: 'AAPL',
          isActive: true,
          checkInterval: 60000,
          lastChecked: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          symbol: 'GOOGL',
          isActive: true,
          checkInterval: 60000,
          lastChecked: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      symbolRepository.findAll.mockResolvedValue(activeSymbols);

      const result = await service.getActiveSymbols();

      expect(result).toEqual(activeSymbols);
      expect(symbolRepository.findAll).toHaveBeenCalledWith(true);
    });
  });
});
