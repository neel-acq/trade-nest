import { Order, OrderType } from '@prisma/client';
import { isBuyOrder, isMarketOrder } from '../../order/entities/order.entity';

export class MemoryOrder {
  id: string;
  userId: string;
  stockId: string;
  isBuy: boolean;
  isMarket: boolean;
  price: number;
  quantity: number;
  filledQuantity: number;
  createdAt: number;
  next: MemoryOrder | null = null;
  prev: MemoryOrder | null = null;

  constructor(order: Order) {
    this.id = order.id;
    this.userId = order.userId;
    this.stockId = order.stockId;
    this.isBuy = isBuyOrder(order.type);
    this.isMarket = isMarketOrder(order.type);
    this.price = Number(order.price ?? 0);
    this.quantity = order.quantity;
    this.filledQuantity = order.filledQuantity;
    this.createdAt = order.createdAt.getTime();
  }

  get remaining(): number {
    return this.quantity - this.filledQuantity;
  }
}
