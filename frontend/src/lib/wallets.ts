import type { PaginatedResponse, SafeWallet, SafeWalletWithUser } from '@/types';
import { apiFetch } from './api';

export function fetchMyWallet() {
  return apiFetch<SafeWallet>('/wallets/me');
}

export function fetchWallets(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeWalletWithUser>>(`/wallets${query ? `?${query}` : ''}`);
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}
