import type { PaginatedResponse, PortfolioOverview, PortfolioSummary, SafeHolding } from '@/types';
import { apiFetch } from './api';

export function fetchPortfolioSummary() {
  return apiFetch<PortfolioSummary>('/portfolio/me/summary');
}

export function fetchPortfolio(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PortfolioOverview>(`/portfolio/me${query ? `?${query}` : ''}`);
}

export function fetchHoldings(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeHolding>>(
    `/portfolio/me/holdings${query ? `?${query}` : ''}`,
  );
}

export function fetchHoldingBySymbol(symbol: string) {
  return apiFetch<SafeHolding>(`/portfolio/me/holdings/${symbol}`);
}
