import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import { OrderRepository } from '../../order/repositories/order.repository';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { StockService } from '../../stock/services/stock.service';
import { TradeExecutedEvent } from '../../trade/events/trade-executed.event';
import { TradeRepository } from '../../trade/repositories/trade.repository';
import { WalletService } from '../../wallet/services/wallet.service';
import { MemoryOrderBook, TradeResult } from '../data-structures/memory-order-book';
import { MemoryOrder } from '../data-structures/memory-order';
import { isLimitOrder, isMarketOrder } from '../../order/entities/order.entity';

export interface MatchExecutionResult {
  orderId: string;
  tradesExecuted: number;
  totalQuantityFilled: number;
}

@Injectable()
export class MatchingEngineService implements OnModuleInit {
  private readonly logger = new Logger(MatchingEngineService.name);
  private books = new Map<string, MemoryOrderBook>();

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly tradeRepository: TradeRepository,
    private readonly walletService: WalletService,
    private readonly portfolioService: PortfolioService,
    private readonly stockService: StockService,
    private readonly eventBus: DomainEventBus,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing In-Memory Order Books (DSA Showcase)...');
    const stocks = await this.stockService.getAllStocks();
    let loadedOrders = 0;
    
    for (const stock of stocks) {
      this.books.set(stock.id, new MemoryOrderBook(stock.id));
      const openOrders = await this.orderRepository.findOpenOrdersByStock(stock.id);
      for (const order of openOrders) {
        this.books.get(stock.id)!.addOrder(new MemoryOrder(order));
        loadedOrders++;
      }
    }
    this.logger.log(`Loaded ${stocks.length} order books with ${loadedOrders} active orders into memory.`);
  }

  public getBook(stockId: string): MemoryOrderBook | undefined {
    return this.books.get(stockId);
  }

  getStatus() {
    return { module: 'matching', status: 'active', phase: 8, type: 'in-memory-optimized' };
  }

  async processOrder(orderId: string): Promise<MatchExecutionResult> {
    const order = await this.orderRepository.findByIdForUpdate(orderId);
    if (!order || !this.isMatchable(order)) {
      return { orderId, tradesExecuted: 0, totalQuantityFilled: 0 };
    }

    const book = this.books.get(order.stockId);
    if (!book) {
      this.logger.error(`Order book not found for stock ${order.stockId}`);
      return { orderId, tradesExecuted: 0, totalQuantityFilled: 0 };
    }

    const memoryOrder = new MemoryOrder(order);
    
    // ATOMIC IN-MEMORY MATCHING: O(1) matching from top of book
    const trades = book.processIncomingOrder(memoryOrder);
    
    let totalQuantityFilled = 0;

    // ASYNC PERSISTENCE (Write-Behind pattern approach for trades)
    for (const trade of trades) {
      const filled = await this.persistTrade(order, trade);
      totalQuantityFilled += filled;
    }

    if (memoryOrder.isMarket && memoryOrder.remaining > 0) {
       await this.orderRepository.updateFill(order.id, memoryOrder.filledQuantity, OrderStatus.CANCELLED);
       // Note: Wallet release is normally handled by the Order Service when status changes to CANCELLED.
       // The matching engine shouldn't double-release.
    }

    return { orderId, tradesExecuted: trades.length, totalQuantityFilled };
  }

  public async cancelOrder(orderId: string, stockId: string) {
    const book = this.books.get(stockId);
    if (book) {
      book.cancelOrder(orderId);
    }
  }

  private async persistTrade(incomingOrder: Order, trade: TradeResult): Promise<number> {
    const { buyOrderId, sellOrderId, price, quantity } = trade;

    if (quantity <= 0) return 0;

    const tradeAmount = Number((price * quantity).toFixed(2));
    const tradeId = this.generateTradeId();

    const buyOrder = buyOrderId === incomingOrder.id ? incomingOrder : await this.orderRepository.findByIdForUpdate(buyOrderId);
    const sellOrder = sellOrderId === incomingOrder.id ? incomingOrder : await this.orderRepository.findByIdForUpdate(sellOrderId);

    if (!buyOrder || !sellOrder) {
       this.logger.error(`Order not found during trade persistence: Buy ${buyOrderId}, Sell ${sellOrderId}`);
       return 0;
    }

    await this.tradeRepository.create({
      tradeId,
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
      stockId: buyOrder.stockId,
      quantity,
      price,
    });

    await this.updateOrderAfterFill(buyOrder, quantity);
    await this.updateOrderAfterFill(sellOrder, quantity);

    await this.walletService.settleBuy(buyOrder.userId, tradeAmount, `trade:${tradeId}`);
    await this.walletService.credit(sellOrder.userId, tradeAmount, `trade:${tradeId}`);

    if (isLimitOrder(buyOrder.type)) {
      const limitPrice = Number(buyOrder.price ?? 0);
      if (limitPrice > price) {
        const improvement = Number(((limitPrice - price) * quantity).toFixed(2));
        await this.walletService.unlockFunds(buyOrder.userId, improvement, `price_improvement:${tradeId}`);
      }
    } else if (isMarketOrder(buyOrder.type)) {
      const refPrice = Number(buyOrder.price ?? 0);
      if (refPrice > price) {
        const improvement = Number(((refPrice - price) * quantity).toFixed(2));
        await this.walletService.unlockFunds(buyOrder.userId, improvement, `market_price_improvement:${tradeId}`);
      }
    }

    await this.portfolioService.applyBuyTrade(buyOrder.userId, buyOrder.stockId, quantity, price);
    await this.portfolioService.applySellTrade(sellOrder.userId, sellOrder.stockId, quantity, price);

    await this.stockService.recordTrade(buyOrder.stockId, price, quantity);

    const stock = await this.stockService.getStockById(buyOrder.stockId);

    this.eventBus.publish(
      new TradeExecutedEvent({
        tradeId,
        stockId: buyOrder.stockId,
        symbol: stock.symbol,
        quantity,
        price,
        buyUserId: buyOrder.userId,
        sellUserId: sellOrder.userId,
      }),
    );

    return quantity;
  }

  private async updateOrderAfterFill(order: Order, fillQty: number) {
    const newFilled = order.filledQuantity + fillQty;
    const status = newFilled >= order.quantity ? OrderStatus.FILLED : OrderStatus.PARTIAL;
    await this.orderRepository.updateFill(order.id, newFilled, status);
  }

  private isMatchable(order: Order): boolean {
    return (
      (order.status === OrderStatus.OPEN || order.status === OrderStatus.PARTIAL) &&
      order.filledQuantity < order.quantity
    );
  }

  private generateTradeId(): string {
    const suffix = randomBytes(4).toString('hex').toUpperCase();
    return `TRD-${Date.now()}-${suffix}`;
  }
}
