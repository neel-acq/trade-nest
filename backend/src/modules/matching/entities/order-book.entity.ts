export interface OrderBookEntry {
  orderId: string;
  price: number;
  quantity: number;
  remainingQuantity: number;
  createdAt: Date;
}

export interface DepthLevel {
  price: number;
  quantity: number;
  orderCount: number;
}

export interface OrderBookSnapshot {
  stockId: string;
  symbol: string;
  companyName: string;
  lastPrice: number;
  timestamp: Date;
  topBuys: OrderBookEntry[];
  topSells: OrderBookEntry[];
  depth: {
    bids: DepthLevel[];
    asks: DepthLevel[];
  };
  summary: {
    totalOpenBuyOrders: number;
    totalOpenSellOrders: number;
    totalBidQuantity: number;
    totalAskQuantity: number;
  };
}
