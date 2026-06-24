import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface PriceHistoryPoint {
  stockId: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: string;
}

@Injectable()
export class StockPriceHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(points: PriceHistoryPoint[]) {
    if (points.length === 0) return { count: 0 };

    return this.prisma.stockPriceHistory.createMany({
      data: points.map((p) => ({
        stockId: p.stockId,
        timestamp: p.timestamp,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: BigInt(p.volume),
        interval: p.interval,
        isSystemGenerated: true,
      })),
      skipDuplicates: true,
    });
  }

  findByStockId(stockId: string, interval = '1d', limit = 365) {
    return this.prisma.stockPriceHistory.findMany({
      where: { stockId, interval, deletedAt: null },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });
  }

  countByStockId(stockId: string, interval = '1d') {
    return this.prisma.stockPriceHistory.count({
      where: { stockId, interval, deletedAt: null },
    });
  }

  findByStockAndTimestamp(stockId: string, timestamp: Date, interval: string) {
    return this.prisma.stockPriceHistory.findUnique({
      where: {
        stockId_timestamp_interval: { stockId, timestamp, interval },
      },
    });
  }

  async upsertTradeCandle(
    stockId: string,
    timestamp: Date,
    interval: string,
    price: number,
    quantity: number,
  ) {
    const existing = await this.findByStockAndTimestamp(stockId, timestamp, interval);

    if (existing) {
      const high = Math.max(Number(existing.high), price);
      const low = Math.min(Number(existing.low), price);
      return this.prisma.stockPriceHistory.update({
        where: { id: existing.id },
        data: {
          high,
          low,
          close: price,
          volume: { increment: BigInt(quantity) },
          isSystemGenerated: false,
        },
      });
    }

    return this.prisma.stockPriceHistory.create({
      data: {
        stockId,
        timestamp,
        interval,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: BigInt(quantity),
        isSystemGenerated: false,
      },
    });
  }
}
