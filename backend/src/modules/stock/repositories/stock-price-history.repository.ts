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
}
