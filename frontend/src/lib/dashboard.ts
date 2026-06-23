import type { AdminDashboardOverview, TraderDashboardOverview } from '@/types';
import { apiFetch } from './api';

export function fetchMyDashboard() {
  return apiFetch<TraderDashboardOverview>('/dashboard/me');
}

export function fetchAdminDashboard() {
  return apiFetch<AdminDashboardOverview>('/dashboard/admin');
}
