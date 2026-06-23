import { Injectable } from '@nestjs/common';
import { Prisma, Trade } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import { TradeWithRelations } from '../entities/trade.entity';

export interface CreateTradeData {
  tradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  stockId: string;
  quantity: number;
  price: number;
  executedAt?: Date;
  isSystemGenerated?: boolean;
}

export interface FindTradesParams {
  page: number;
  limit: number;
  stockId?: string;
  userId?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy: 'executedAt' | 'quantity' | 'price';
  sortOrder: 'asc' | 'desc';
}

const stockSelect = { symbol: true, companyName: true } as const;
const orderSelect = {
  id: true,
  userId: true,
  type: true,
  user: { select: { username: true, fullName: true } },
} as const;

@Injectable()
export class TradeRepository {
  constructor(private readonly prisma: PrismaService) {}

  countSystemGenerated() {
    return this.prisma.trade.count({
      where: { isSystemGenerated: true, deletedAt: null },
    });
  }

  create(data: CreateTradeData): Promise<Trade> {
    return this.prisma.trade.create({
      data: {
        tradeId: data.tradeId,
        buyOrderId: data.buyOrderId,
        sellOrderId: data.sellOrderId,
        stockId: data.stockId,
        quantity: data.quantity,
        price: data.price,
        executedAt: data.executedAt ?? new Date(),
        isSystemGenerated: data.isSystemGenerated ?? false,
      },
    });
  }

  findById(id: string): Promise<TradeWithRelations | null> {
    return this.prisma.trade.findFirst({
      where: { id, deletedAt: null },
      include: {
        stock: { select: stockSelect },
        buyOrder: { select: orderSelect },
        sellOrder: { select: orderSelect },
      },
    }) as Promise<TradeWithRelations | null>;
  }

  findByTradeId(tradeId: string): Promise<TradeWithRelations | null> {
    return this.prisma.trade.findFirst({
      where: { tradeId, deletedAt: null },
      include: {
        stock: { select: stockSelect },
        buyOrder: { select: orderSelect },
        sellOrder: { select: orderSelect },
      },
    }) as Promise<TradeWithRelations | null>;
  }

  async findManyPaginated(params: FindTradesParams) {
    const { page, limit, stockId, userId, search, fromDate, toDate, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TradeWhereInput = {
      deletedAt: null,
      ...(stockId ? { stockId } : {}),
      ...(userId
        ? {
            OR: [{ buyOrder: { userId } }, { sellOrder: { userId } }],
          }
        : {}),
      ...(fromDate || toDate
        ? {
            executedAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { tradeId: { contains: search, mode: 'insensitive' } },
              {
                stock: {
                  OR: [
                    { symbol: { contains: search, mode: 'insensitive' } },
                    { companyName: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.TradeOrderByWithRelationInput =
      sortBy === 'executedAt' ? { executedAt: sortOrder } : { [sortBy]: sortOrder };

    const [total, trades] = await this.prisma.$transaction([
      this.prisma.trade.count({ where }),
      this.prisma.trade.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          stock: { select: stockSelect },
          buyOrder: { select: orderSelect },
          sellOrder: { select: orderSelect },
        },
      }),
    ]);

    return { total, trades: trades as TradeWithRelations[] };
  }

  deleteSystemGenerated() {
    return this.prisma.trade.deleteMany({
      where: { isSystemGenerated: true },
    });
  }

  countAll() {
    return this.prisma.trade.count({
      where: { deletedAt: null },
    });
  }

  async getUserTradeStats(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        deletedAt: null,
        OR: [{ buyOrder: { userId } }, { sellOrder: { userId } }],
      },
      select: { quantity: true, price: true },
    });

    const totalTurnover = trades.reduce(
      (sum, trade) => sum + Number(trade.price) * trade.quantity,
      0,
    );

    return {
      totalTrades: trades.length,
      totalTurnover: Number(totalTurnover.toFixed(2)),
    };
  }

  async getPlatformTradeStats() {
    const trades = await this.prisma.trade.findMany({
      where: { deletedAt: null },
      select: { quantity: true, price: true },
    });

    const totalTurnover = trades.reduce(
      (sum, trade) => sum + Number(trade.price) * trade.quantity,
      0,
    );

    return {
      totalTrades: trades.length,
      totalTurnover: Number(totalTurnover.toFixed(2)),
    };
  }

  findRecentByUser(userId: string, limit: number) {
    return this.prisma.trade.findMany({
      where: {
        deletedAt: null,
        OR: [{ buyOrder: { userId } }, { sellOrder: { userId } }],
      },
      orderBy: { executedAt: 'desc' },
      take: limit,
      include: {
        stock: { select: stockSelect },
        buyOrder: { select: orderSelect },
        sellOrder: { select: orderSelect },
      },
    }) as Promise<TradeWithRelations[]>;
  }

  findRecentGlobal(limit: number) {
    return this.prisma.trade.findMany({
      where: { deletedAt: null },
      orderBy: { executedAt: 'desc' },
      take: limit,
      include: {
        stock: { select: stockSelect },
        buyOrder: { select: orderSelect },
        sellOrder: { select: orderSelect },
      },
    }) as Promise<TradeWithRelations[]>;
  }
}
