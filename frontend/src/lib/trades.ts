import type { PaginatedResponse, SafeTrade } from '@/types';
import { apiFetch } from './api';

export function fetchTrades(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeTrade>>(`/trades${query ? `?${query}` : ''}`);
}

export function fetchTrade(tradeRef: string) {
  return apiFetch<SafeTrade>(`/trades/${tradeRef}`);
}

export function fetchStockTrades(
  symbol: string,
  params: Record<string, string | number | undefined> = {},
) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeTrade>>(
    `/trades/stocks/${symbol}${query ? `?${query}` : ''}`,
  );
}
