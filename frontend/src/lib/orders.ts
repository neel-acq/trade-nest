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
