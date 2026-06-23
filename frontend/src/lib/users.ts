import type { AuthUser, PaginatedResponse } from '@/types';
import { apiFetch } from './api';

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'TRADER';
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function fetchUsers(params: QueryUsersParams = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<AuthUser>>(`/users${query ? `?${query}` : ''}`);
}

export interface UpdateProfilePayload {
  username?: string;
  fullName?: string;
  email?: string;
  password?: string;
}

export function updateProfile(payload: UpdateProfilePayload) {
  return apiFetch<AuthUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TRADER';
}

export function createUser(payload: CreateUserPayload) {
  return apiFetch<AuthUser>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: string) {
  return apiFetch<{ message: string; id: string }>(`/users/${id}`, {
    method: 'DELETE',
  });
}
