import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SymbolConfig, Prisma } from '@prisma/client';

@Injectable()
export class SymbolRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SymbolConfigCreateInput): Promise<SymbolConfig> {
    return this.prisma.symbolConfig.create({ data });
  }

  async findOne(symbol: string): Promise<SymbolConfig | null> {
    return this.prisma.symbolConfig.findUnique({
      where: { symbol: symbol.toUpperCase() },
      include: {
        schedulerJob: true,
      },
    });
  }

  async findAll(isActive?: boolean): Promise<SymbolConfig[]> {
    const where: Prisma.SymbolConfigWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.symbolConfig.findMany({
      where,
      include: {
        schedulerJob: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    symbol: string,
    data: Prisma.SymbolConfigUpdateInput,
  ): Promise<SymbolConfig> {
    return this.prisma.symbolConfig.update({
      where: { symbol: symbol.toUpperCase() },
      data,
    });
  }

  async updateLastChecked(symbol: string): Promise<SymbolConfig> {
    return this.prisma.symbolConfig.update({
      where: { symbol: symbol.toUpperCase() },
      data: {
        lastChecked: new Date(),
      },
    });
  }

  async delete(symbol: string): Promise<SymbolConfig> {
    return this.prisma.symbolConfig.delete({
      where: { symbol: symbol.toUpperCase() },
    });
  }

  async exists(symbol: string): Promise<boolean> {
    const count = await this.prisma.symbolConfig.count({
      where: { symbol: symbol.toUpperCase() },
    });
    return count > 0;
  }
}
