import { Injectable } from '@nestjs/common';
import { Prisma, PortfolioHolding } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { HoldingWithStock } from '../entities/portfolio.entity';

export interface UpsertPortfolioData {
  userId: string;
  stockId: string;
  quantity: number;
  averageBuyPrice: number;
  investedAmount: number;
  realizedPnL?: number;
  isSystemGenerated?: boolean;
}

export interface FindHoldingsParams {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  sortBy: 'symbol' | 'quantity' | 'investedAmount' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

const stockSelect = { symbol: true, companyName: true, currentPrice: true } as const;

@Injectable()
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(data: UpsertPortfolioData): Promise<PortfolioHolding> {
    return this.prisma.portfolioHolding.upsert({
      where: {
        userId_stockId: {
          userId: data.userId,
          stockId: data.stockId,
        },
      },
      create: {
        userId: data.userId,
        stockId: data.stockId,
        quantity: data.quantity,
        averageBuyPrice: data.averageBuyPrice,
        investedAmount: data.investedAmount,
        realizedPnL: data.realizedPnL ?? 0,
        isSystemGenerated: data.isSystemGenerated ?? true,
      },
      update: {
        quantity: data.quantity,
        averageBuyPrice: data.averageBuyPrice,
        investedAmount: data.investedAmount,
        realizedPnL: data.realizedPnL ?? 0,
      },
    });
  }

  deleteSystemGenerated() {
    return this.prisma.portfolioHolding.deleteMany({
      where: { isSystemGenerated: true },
    });
  }

  findHolding(userId: string, stockId: string): Promise<HoldingWithStock | null> {
    return this.prisma.portfolioHolding.findFirst({
      where: { userId, stockId, deletedAt: null, quantity: { gt: 0 } },
      include: { stock: { select: stockSelect } },
    }) as Promise<HoldingWithStock | null>;
  }

  findAllByUserId(userId: string): Promise<HoldingWithStock[]> {
    return this.prisma.portfolioHolding.findMany({
      where: { userId, deletedAt: null, quantity: { gt: 0 } },
      include: { stock: { select: stockSelect } },
      orderBy: { updatedAt: 'desc' },
    }) as Promise<HoldingWithStock[]>;
  }

  async findManyPaginated(params: FindHoldingsParams) {
    const { userId, page, limit, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PortfolioHoldingWhereInput = {
      userId,
      deletedAt: null,
      quantity: { gt: 0 },
      ...(search
        ? {
            stock: {
              OR: [
                { symbol: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const orderBy: Prisma.PortfolioHoldingOrderByWithRelationInput =
      sortBy === 'symbol'
        ? { stock: { symbol: sortOrder } }
        : { [sortBy]: sortOrder };

    const [total, holdings] = await this.prisma.$transaction([
      this.prisma.portfolioHolding.count({ where }),
      this.prisma.portfolioHolding.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { stock: { select: stockSelect } },
      }),
    ]);

    return { total, holdings: holdings as HoldingWithStock[] };
  }

  deleteHolding(userId: string, stockId: string) {
    return this.prisma.portfolioHolding.delete({
      where: {
        userId_stockId: { userId, stockId },
      },
    });
  }
}
