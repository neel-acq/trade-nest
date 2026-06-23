export const REALTIME_EVENTS = {
  CONNECTED: 'realtime.connected',
  TRADE_EXECUTED: 'trade.executed',
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
  ORDERBOOK_UPDATED: 'orderbook.updated',
  STOCK_PRICE: 'stock.price',
  WALLET_UPDATED: 'wallet.updated',
  NOTIFICATION_CREATED: 'notification.created',
} as const;

export const CLIENT_EVENTS = {
  SUBSCRIBE_STOCK: 'subscribe:stock',
  UNSUBSCRIBE_STOCK: 'unsubscribe:stock',
} as const;
