import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StockPrice, Prisma } from '@prisma/client';

@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.StockPriceCreateInput): Promise<StockPrice> {
    return this.prisma.stockPrice.create({ data });
  }

  async findLatest(symbol: string): Promise<StockPrice | null> {
    return this.prisma.stockPrice.findFirst({
      where: { symbol: symbol.toUpperCase() },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findMany(
    symbol: string,
    limit = 10,
    offset = 0,
  ): Promise<StockPrice[]> {
    return this.prisma.stockPrice.findMany({
      where: { symbol: symbol.toUpperCase() },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findByTimeRange(
    symbol: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StockPrice[]> {
    return this.prisma.stockPrice.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getMovingAverage(symbol: string, count = 10): Promise<number | null> {
    const recentPrices = await this.prisma.stockPrice.findMany({
      where: { symbol: symbol.toUpperCase() },
      orderBy: { timestamp: 'desc' },
      take: count,
      select: { price: true },
    });

    if (recentPrices.length === 0) {
      return null;
    }

    const sum = recentPrices.reduce((acc, { price }) => acc + Number(price), 0);
    return sum / recentPrices.length;
  }

  async getLastNPrices(symbol: string, count = 10): Promise<StockPrice[]> {
    return this.prisma.stockPrice.findMany({
      where: { symbol: symbol.toUpperCase() },
      orderBy: { timestamp: 'desc' },
      take: count,
    });
  }

  async getPriceStats(symbol: string) {
    const stats = await this.prisma.stockPrice.aggregate({
      where: { symbol: symbol.toUpperCase() },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: true,
    });

    return {
      average: stats._avg.price ? Number(stats._avg.price) : null,
      min: stats._min.price ? Number(stats._min.price) : null,
      max: stats._max.price ? Number(stats._max.price) : null,
      count: stats._count,
    };
  }

  async deleteOldPrices(symbol: string, olderThan: Date): Promise<number> {
    const result = await this.prisma.stockPrice.deleteMany({
      where: {
        symbol: symbol.toUpperCase(),
        timestamp: {
          lt: olderThan,
        },
      },
    });
    return result.count;
  }

  async count(symbol?: string): Promise<number> {
    const where: Prisma.StockPriceWhereInput = {};
    if (symbol) {
      where.symbol = symbol.toUpperCase();
    }
    return this.prisma.stockPrice.count({ where });
  }
}
