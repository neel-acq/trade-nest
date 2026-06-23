import { Injectable, NotFoundException } from '@nestjs/common';
import { Order } from '@prisma/client';
import { OrderRepository } from '../../order/repositories/order.repository';
import { StockService } from '../../stock/services/stock.service';
import {
  DepthLevel,
  OrderBookEntry,
  OrderBookSnapshot,
} from '../entities/order-book.entity';

@Injectable()
export class OrderBookService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly stockService: StockService,
  ) {}

  async getSnapshotBySymbol(symbol: string): Promise<OrderBookSnapshot> {
    const stock = await this.stockService.findBySymbol(symbol);
    if (!stock) {
      throw new NotFoundException(`Stock ${symbol} not found`);
    }

    const [buyOrders, sellOrders] = await Promise.all([
      this.orderRepository.findOpenBuyOrders(stock.id),
      this.orderRepository.findOpenSellOrders(stock.id),
    ]);

    const topBuys = buyOrders.slice(0, 5).map((order) => this.toEntry(order));
    const topSells = sellOrders.slice(0, 5).map((order) => this.toEntry(order));

    const depthBids = this.aggregateDepth(buyOrders, 'desc');
    const depthAsks = this.aggregateDepth(sellOrders, 'asc');

    return {
      stockId: stock.id,
      symbol: stock.symbol,
      companyName: stock.companyName,
      lastPrice: Number(stock.currentPrice),
      timestamp: new Date(),
      topBuys,
      topSells,
      depth: { bids: depthBids, asks: depthAsks },
      summary: {
        totalOpenBuyOrders: buyOrders.length,
        totalOpenSellOrders: sellOrders.length,
        totalBidQuantity: this.sumRemaining(buyOrders),
        totalAskQuantity: this.sumRemaining(sellOrders),
      },
    };
  }

  private toEntry(order: Order): OrderBookEntry {
    const remaining = order.quantity - order.filledQuantity;
    return {
      orderId: order.id,
      price: Number(order.price ?? 0),
      quantity: order.quantity,
      remainingQuantity: remaining,
      createdAt: order.createdAt,
    };
  }

  private aggregateDepth(orders: Order[], sort: 'asc' | 'desc'): DepthLevel[] {
    const byPrice = new Map<number, { quantity: number; orderCount: number }>();

    for (const order of orders) {
      const price = Number(order.price ?? 0);
      const remaining = order.quantity - order.filledQuantity;
      if (remaining <= 0) continue;

      const level = byPrice.get(price) ?? { quantity: 0, orderCount: 0 };
      level.quantity += remaining;
      level.orderCount += 1;
      byPrice.set(price, level);
    }

    return [...byPrice.entries()]
      .map(([price, data]) => ({
        price,
        quantity: data.quantity,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => (sort === 'desc' ? b.price - a.price : a.price - b.price));
  }

  private sumRemaining(orders: Order[]): number {
    return orders.reduce((sum, order) => sum + (order.quantity - order.filledQuantity), 0);
  }
}
