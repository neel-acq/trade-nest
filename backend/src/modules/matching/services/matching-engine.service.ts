import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Order, OrderStatus, OrderType } from '@prisma/client';
import { randomBytes } from 'crypto';
import { DomainEventBus } from '@/common/events/domain-event-bus.service';
import {
  isBuyOrder,
  isLimitOrder,
  isMarketOrder,
  isSellOrder,
} from '../../order/entities/order.entity';
import { OrderRepository } from '../../order/repositories/order.repository';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { StockService } from '../../stock/services/stock.service';
import { TradeExecutedEvent } from '../../trade/events/trade-executed.event';
import { TradeRepository } from '../../trade/repositories/trade.repository';
import { WalletService } from '../../wallet/services/wallet.service';

export interface MatchExecutionResult {
  orderId: string;
  tradesExecuted: number;
  totalQuantityFilled: number;
}

@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly tradeRepository: TradeRepository,
    private readonly walletService: WalletService,
    private readonly portfolioService: PortfolioService,
    private readonly stockService: StockService,
    private readonly eventBus: DomainEventBus,
  ) {}

  getStatus() {
    return { module: 'matching', status: 'active', phase: 8 };
  }

  async processOrder(orderId: string): Promise<MatchExecutionResult> {
    const order = await this.orderRepository.findByIdForUpdate(orderId);
    if (!order || !this.isMatchable(order)) {
      return { orderId, tradesExecuted: 0, totalQuantityFilled: 0 };
    }

    if (isBuyOrder(order.type)) {
      return this.matchIncomingBuy(order);
    }

    if (isSellOrder(order.type)) {
      return this.matchIncomingSell(order);
    }

    return { orderId, tradesExecuted: 0, totalQuantityFilled: 0 };
  }

  private async matchIncomingBuy(buyOrder: Order): Promise<MatchExecutionResult> {
    const sellOrders = await this.orderRepository.findOpenSellOrders(buyOrder.stockId);
    let tradesExecuted = 0;
    let totalQuantityFilled = 0;

    for (const sellOrder of sellOrders) {
      const currentBuy = await this.orderRepository.findByIdForUpdate(buyOrder.id);
      if (!currentBuy || !this.isMatchable(currentBuy)) break;

      const buyRemaining = currentBuy.quantity - currentBuy.filledQuantity;
      if (buyRemaining <= 0) break;

      const currentSell = await this.orderRepository.findByIdForUpdate(sellOrder.id);
      if (!currentSell || !this.isMatchable(currentSell)) continue;

      if (currentBuy.userId === currentSell.userId) continue;

      if (!this.canMatch(currentBuy, currentSell)) continue;

      const sellRemaining = currentSell.quantity - currentSell.filledQuantity;
      const tradeQty = Math.min(buyRemaining, sellRemaining);
      const tradePrice = Number(currentSell.price ?? 0);

      const sellerAvailable = await this.portfolioService.getHoldingQuantity(
        currentSell.userId,
        currentSell.stockId,
      );
      if (sellerAvailable < tradeQty) {
        this.logger.warn(
          `Skipping match: seller ${currentSell.userId} has insufficient holdings for order ${currentSell.id}`,
        );
        continue;
      }

      const filled = await this.executeTrade({
        buyOrder: currentBuy,
        sellOrder: currentSell,
        quantity: tradeQty,
        price: tradePrice,
      });

      tradesExecuted += 1;
      totalQuantityFilled += filled;
    }

    return { orderId: buyOrder.id, tradesExecuted, totalQuantityFilled };
  }

  private async matchIncomingSell(sellOrder: Order): Promise<MatchExecutionResult> {
    const buyOrders = await this.orderRepository.findOpenBuyOrders(sellOrder.stockId);
    let tradesExecuted = 0;
    let totalQuantityFilled = 0;

    for (const buyOrder of buyOrders) {
      const currentSell = await this.orderRepository.findByIdForUpdate(sellOrder.id);
      if (!currentSell || !this.isMatchable(currentSell)) break;

      const sellRemaining = currentSell.quantity - currentSell.filledQuantity;
      if (sellRemaining <= 0) break;

      const currentBuy = await this.orderRepository.findByIdForUpdate(buyOrder.id);
      if (!currentBuy || !this.isMatchable(currentBuy)) continue;

      if (currentBuy.userId === currentSell.userId) continue;

      if (!this.canMatch(currentBuy, currentSell)) continue;

      const buyRemaining = currentBuy.quantity - currentBuy.filledQuantity;
      const tradeQty = Math.min(buyRemaining, sellRemaining);
      const tradePrice = Number(currentBuy.price ?? 0);

      const sellerAvailable = await this.portfolioService.getHoldingQuantity(
        currentSell.userId,
        currentSell.stockId,
      );
      if (sellerAvailable < tradeQty) {
        this.logger.warn(
          `Skipping match: seller ${currentSell.userId} has insufficient holdings for order ${currentSell.id}`,
        );
        continue;
      }

      const filled = await this.executeTrade({
        buyOrder: currentBuy,
        sellOrder: currentSell,
        quantity: tradeQty,
        price: tradePrice,
      });

      tradesExecuted += 1;
      totalQuantityFilled += filled;
    }

    return { orderId: sellOrder.id, tradesExecuted, totalQuantityFilled };
  }

  private canMatch(buyOrder: Order, sellOrder: Order): boolean {
    const buyPrice = Number(buyOrder.price ?? 0);
    const sellPrice = Number(sellOrder.price ?? 0);

    if (isMarketOrder(buyOrder.type) || isMarketOrder(sellOrder.type)) {
      return true;
    }

    return buyPrice >= sellPrice;
  }

  private async executeTrade(params: {
    buyOrder: Order;
    sellOrder: Order;
    quantity: number;
    price: number;
  }): Promise<number> {
    const { buyOrder, sellOrder, quantity, price } = params;
    if (quantity <= 0) {
      throw new BadRequestException('Trade quantity must be positive');
    }

    const tradeAmount = Number((price * quantity).toFixed(2));
    const tradeId = this.generateTradeId();

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
        await this.walletService.unlockFunds(
          buyOrder.userId,
          improvement,
          `price_improvement:${tradeId}`,
        );
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
    const status =
      newFilled >= order.quantity ? OrderStatus.FILLED : OrderStatus.PARTIAL;
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
