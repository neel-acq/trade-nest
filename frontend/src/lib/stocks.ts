import type { PaginatedResponse, SafeStock, StockHistoryResponse } from '@/types';
import { apiFetch } from './api';

export interface QueryStocksParams {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minChangePercentage?: number;
  maxChangePercentage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function fetchStocks(params: QueryStocksParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeStock>>(`/stocks${query ? `?${query}` : ''}`);
}

export function fetchStockBySymbol(symbol: string) {
  return apiFetch<SafeStock>(`/stocks/symbol/${encodeURIComponent(symbol)}`);
}

export function fetchStockHistory(
  symbol: string,
  options: { interval?: '1d' | '1h'; limit?: number } = {},
) {
  const { interval = '1d', limit = 90 } = options;
  return apiFetch<StockHistoryResponse>(
    `/stocks/symbol/${encodeURIComponent(symbol)}/history?interval=${interval}&limit=${limit}`,
  );
}

export function importStocksCsv(csv: string) {
  return apiFetch<{ created: number; skipped: number; errors: string[] }>('/stocks/import/csv', {
    method: 'POST',
    body: JSON.stringify({ csv }),
  });
}
