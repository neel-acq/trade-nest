import { Order, Stock, Trade, User } from '@prisma/client';

export type TradeWithRelations = Trade & {
  stock: Pick<Stock, 'symbol' | 'companyName'>;
  buyOrder: Pick<Order, 'id' | 'userId' | 'type'> & {
    user: Pick<User, 'username' | 'fullName'>;
  };
  sellOrder: Pick<Order, 'id' | 'userId' | 'type'> & {
    user: Pick<User, 'username' | 'fullName'>;
  };
};

export interface SafeTrade {
  id: string;
  tradeId: string;
  stockId: string;
  symbol: string;
  companyName: string;
  quantity: number;
  price: number;
  totalValue: number;
  executedAt: Date;
  buyOrderId: string;
  sellOrderId: string;
  buyer: {
    userId: string;
    username: string;
    fullName: string;
  };
  seller: {
    userId: string;
    username: string;
    fullName: string;
  };
  side?: 'BUY' | 'SELL';
  isSystemGenerated: boolean;
  createdAt: Date;
}

export function toSafeTrade(trade: TradeWithRelations, viewerUserId?: string): SafeTrade {
  const price = Number(trade.price);
  const safe: SafeTrade = {
    id: trade.id,
    tradeId: trade.tradeId,
    stockId: trade.stockId,
    symbol: trade.stock.symbol,
    companyName: trade.stock.companyName,
    quantity: trade.quantity,
    price,
    totalValue: Number((price * trade.quantity).toFixed(2)),
    executedAt: trade.executedAt,
    buyOrderId: trade.buyOrderId,
    sellOrderId: trade.sellOrderId,
    buyer: {
      userId: trade.buyOrder.userId,
      username: trade.buyOrder.user.username,
      fullName: trade.buyOrder.user.fullName,
    },
    seller: {
      userId: trade.sellOrder.userId,
      username: trade.sellOrder.user.username,
      fullName: trade.sellOrder.user.fullName,
    },
    isSystemGenerated: trade.isSystemGenerated,
    createdAt: trade.createdAt,
  };

  if (viewerUserId) {
    if (trade.buyOrder.userId === viewerUserId) {
      safe.side = 'BUY';
    } else if (trade.sellOrder.userId === viewerUserId) {
      safe.side = 'SELL';
    }
  }

  return safe;
}
