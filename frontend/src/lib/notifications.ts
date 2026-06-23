import type { PaginatedResponse, SafeNotification } from '@/types';
import { apiFetch } from './api';

export function fetchNotifications(params: Record<string, string | number | boolean | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeNotification>>(
    `/notifications${query ? `?${query}` : ''}`,
  );
}

export function fetchUnreadCount() {
  return apiFetch<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(id: string) {
  return apiFetch<SafeNotification>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return apiFetch<{ updated: number }>('/notifications/read-all', { method: 'POST' });
}

export function notificationTypeClass(type: SafeNotification['type']) {
  switch (type) {
    case 'TRADE':
      return 'text-green-600';
    case 'ORDER':
      return 'text-blue-600';
    case 'WALLET':
      return 'text-amber-600';
    case 'SECURITY':
      return 'text-purple-600';
    default:
      return 'text-muted-foreground';
  }
}
