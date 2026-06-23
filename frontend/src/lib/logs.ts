import type { LogType, PaginatedResponse, SafeAuditLog, SafeSystemLog } from '@/types';
import { apiFetch } from './api';

export function fetchAuditLogs(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeAuditLog>>(`/audit/logs${query ? `?${query}` : ''}`);
}

export function fetchSystemLogs(params: Record<string, string | number | undefined> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return apiFetch<PaginatedResponse<SafeSystemLog>>(`/system/logs${query ? `?${query}` : ''}`);
}

export function logTypeBadgeClass(logType: LogType) {
  switch (logType) {
    case 'ERROR':
      return 'text-red-600';
    case 'WARNING':
      return 'text-amber-600';
    case 'SUCCESS':
      return 'text-green-600';
    case 'SECURITY':
      return 'text-purple-600';
    default:
      return 'text-muted-foreground';
  }
}
