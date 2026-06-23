import { apiFetch } from './api';

export interface OrderBookEntry {
  orderId: string;
  price: number;
  quantity: number;
  remainingQuantity: number;
  createdAt: string;
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
  timestamp: string;
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

export function fetchOrderBook(symbol: string) {
  return apiFetch<OrderBookSnapshot>(`/matching/stocks/${symbol}/orderbook`);
}
