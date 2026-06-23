import { Order, OrderStatus, OrderType, Stock, User } from '@prisma/client';

export type OrderWithRelations = Order & {
  stock: Pick<Stock, 'symbol' | 'companyName' | 'currentPrice'>;
  user?: Pick<User, 'username' | 'fullName'>;
};

export interface SafeOrder {
  id: string;
  userId: string;
  stockId: string;
  symbol: string;
  companyName: string;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  price: number | null;
  isSystemGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    username: string;
    fullName: string;
  };
}

export function toSafeOrder(order: OrderWithRelations): SafeOrder {
  return {
    id: order.id,
    userId: order.userId,
    stockId: order.stockId,
    symbol: order.stock.symbol,
    companyName: order.stock.companyName,
    type: order.type,
    status: order.status,
    quantity: order.quantity,
    filledQuantity: order.filledQuantity,
    remainingQuantity: order.quantity - order.filledQuantity,
    price: order.price !== null ? Number(order.price) : null,
    isSystemGenerated: order.isSystemGenerated,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    ...(order.user
      ? { user: { username: order.user.username, fullName: order.user.fullName } }
      : {}),
  };
}

export function isBuyOrder(type: OrderType): boolean {
  return type === OrderType.LIMIT_BUY || type === OrderType.MARKET_BUY;
}

export function isSellOrder(type: OrderType): boolean {
  return type === OrderType.LIMIT_SELL || type === OrderType.MARKET_SELL;
}

export function isMarketOrder(type: OrderType): boolean {
  return type === OrderType.MARKET_BUY || type === OrderType.MARKET_SELL;
}

export function isLimitOrder(type: OrderType): boolean {
  return type === OrderType.LIMIT_BUY || type === OrderType.LIMIT_SELL;
}
