const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

import type { AuthUser, LoginResponse, PaginatedResponse, SafeStock, StockHistoryResponse } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildHeaders(options?: RequestInit): HeadersInit {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (!response.ok) {
    let message = `API error: ${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (body.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export { API_URL };
