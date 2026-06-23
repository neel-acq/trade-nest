import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { buildPaginationMeta, PaginatedResult } from '@/common/dto/pagination.dto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { OrderService } from '../../order/services/order.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { StockService } from '../../stock/services/stock.service';
import { QueryTradesDto } from '../dto/query-trades.dto';
import { SafeTrade, toSafeTrade } from '../entities/trade.entity';
import { TradeExecutedEvent } from '../events/trade-executed.event';
import { TradeRepository } from '../repositories/trade.repository';

@Injectable()
export class TradeService {
  constructor(
    private readonly tradeRepository: TradeRepository,
    private readonly orderService: OrderService,
    private readonly portfolioService: PortfolioService,
    private readonly stockService: StockService,
    private readonly eventBus: DomainEventBus,
  ) {}

  getStatus() {
    return { module: 'trade', status: 'active', phase: 9 };
  }

  async listTrades(
    query: QueryTradesDto,
    userId: string,
    userRole: UserRole,
  ): Promise<PaginatedResult<SafeTrade>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const filterUserId = userRole === UserRole.ADMIN ? query.userId : userId;

    const { total, trades } = await this.tradeRepository.findManyPaginated({
      page,
      limit,
      stockId: query.stockId,
      userId: filterUserId,
      search: query.search,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      sortBy: query.sortBy ?? 'executedAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: trades.map((trade) => toSafeTrade(trade, userId)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async listTradesBySymbol(
    symbol: string,
    query: QueryTradesDto,
  ): Promise<PaginatedResult<SafeTrade>> {
    const stock = await this.stockService.findBySymbol(symbol);
    if (!stock) {
      throw new NotFoundException(`Stock ${symbol} not found`);
    }

    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);

    const { total, trades } = await this.tradeRepository.findManyPaginated({
      page,
      limit,
      stockId: stock.id,
      search: query.search,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      sortBy: query.sortBy ?? 'executedAt',
      sortOrder: query.sortOrder ?? 'desc',
    });

    return {
      data: trades.map((trade) => toSafeTrade(trade)),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async getTradeById(
    tradeRef: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SafeTrade> {
    const trade =
      (await this.tradeRepository.findByTradeId(tradeRef)) ??
      (await this.tradeRepository.findById(tradeRef));

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const isParticipant =
      trade.buyOrder.userId === userId || trade.sellOrder.userId === userId;

    if (userRole !== UserRole.ADMIN && !isParticipant) {
      throw new ForbiddenException('Access denied');
    }

    return toSafeTrade(trade, userId);
  }

  async getTradeStats(userId: string) {
    return this.tradeRepository.getUserTradeStats(userId);
  }

  async getRecentTrades(userId: string, limit = 5) {
    const trades = await this.tradeRepository.findRecentByUser(userId, limit);
    return trades.map((trade) => toSafeTrade(trade, userId));
  }

  async getPlatformTradeStats() {
    return this.tradeRepository.getPlatformTradeStats();
  }

  async getRecentPlatformTrades(limit = 10) {
    const trades = await this.tradeRepository.findRecentGlobal(limit);
    return trades.map((trade) => toSafeTrade(trade));
  }

  async seedSystemTrades() {
    const existing = await this.tradeRepository.countSystemGenerated();
    if (existing > 0) {
      return { created: 0, skipped: existing, message: 'System trades already seeded' };
    }

    const orders = await this.orderService.findSystemOrders();
    const buyOrder = orders.find((order) => order.type === 'LIMIT_BUY');
    const sellOrder = orders.find((order) => order.type === 'LIMIT_SELL');

    if (!buyOrder || !sellOrder) {
      return { created: 0, skipped: 0, message: 'Seed orders before trades' };
    }

    const tradePrice = Number(buyOrder.price ?? sellOrder.price ?? 0);
    const quantity = Math.min(buyOrder.quantity, sellOrder.quantity);

    const trade = await this.tradeRepository.create({
      tradeId: 'TRD-SEED-0001',
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
      stockId: buyOrder.stockId,
      quantity,
      price: tradePrice,
      isSystemGenerated: true,
    });

    await this.portfolioService.upsertSystemHolding({
      userId: buyOrder.userId,
      stockId: buyOrder.stockId,
      quantity,
      averageBuyPrice: tradePrice,
      investedAmount: tradePrice * quantity,
    });

    this.eventBus.publish(
      new TradeExecutedEvent({
        tradeId: trade.tradeId,
        stockId: trade.stockId,
        quantity: trade.quantity,
        price: Number(trade.price),
      }),
    );

    return { created: 1, tradeId: trade.tradeId };
  }

  async deleteSystemTrades() {
    const deleted = await this.tradeRepository.deleteSystemGenerated();
    return { deleted: deleted.count };
  }
}
