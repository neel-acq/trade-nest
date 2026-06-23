import type { AuthUser, LoginResponse } from '@/types';
import { apiFetch } from './api';

export async function loginRequest(username: string, password: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutRequest() {
  return apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function getProfileRequest() {
  return apiFetch<AuthUser>('/auth/me');
}
