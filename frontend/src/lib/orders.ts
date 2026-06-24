import type { PaginatedResponse, SafeOrder } from '@/types';
import { apiFetch } from './api';

export type OrderType =
  | 'LIMIT_BUY'
  | 'LIMIT_SELL'
  | 'MARKET_BUY'
  | 'MARKET_SELL';

export interface CreateOrderPayload {
  stockId: string;
  type: OrderType;
  quantity: number;
  price?: number;
}

export function fetchOrders(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeOrder>>(`/orders${query ? `?${query}` : ''}`);
}

export function createOrder(payload: CreateOrderPayload) {
  return apiFetch<SafeOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function cancelOrder(orderId: string) {
  return apiFetch<SafeOrder>(`/orders/${orderId}/cancel`, { method: 'POST' });
}

export interface AdminCreateOrderPayload extends CreateOrderPayload {
  userId: string;
}

export interface AdminLiquidityPairPayload {
  stockId: string;
  sellerUserId: string;
  buyerUserId: string;
  quantity: number;
  price: number;
  grantSellerShares?: boolean;
}

export interface AdminMarketDepthPayload {
  stockId: string;
  sellerUserId: string;
  buyerUserId: string;
  quantity: number;
  sellPrice: number;
  buyPrice: number;
  grantSellerShares?: boolean;
}

export function createAdminOrder(payload: AdminCreateOrderPayload) {
  return apiFetch<SafeOrder>('/orders/admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createLiquidityPair(payload: AdminLiquidityPairPayload) {
  return apiFetch<{ message: string; sellOrder: SafeOrder; buyOrder: SafeOrder }>(
    '/orders/admin/liquidity-pair',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function createMarketDepth(payload: AdminMarketDepthPayload) {
  return apiFetch<{ message: string; sellOrder: SafeOrder; buyOrder: SafeOrder }>(
    '/orders/admin/market-depth',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
