import { create } from 'zustand';
import type { SafeNotification } from '@/types';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  link?: string | null;
}

interface NotificationState {
  unreadCount: number;
  recent: SafeNotification[];
  toasts: ToastItem[];
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: (by?: number) => void;
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  setRecent: (items: SafeNotification[]) => void;
  prependRecent: (item: SafeNotification) => void;
  markRecentRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  recent: [],
  toasts: [],
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set({ unreadCount: get().unreadCount + 1 }),
  decrementUnread: (by = 1) =>
    set({ unreadCount: Math.max(0, get().unreadCount - by) }),
  pushToast: (toast) =>
    set({
      toasts: [...get().toasts, { ...toast, id: crypto.randomUUID() }].slice(-5),
    }),
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setRecent: (items) => set({ recent: items }),
  prependRecent: (item) =>
    set({ recent: [item, ...get().recent.filter((n) => n.id !== item.id)].slice(0, 10) }),
  markRecentRead: (id) =>
    set({
      recent: get().recent.map((n) =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n,
      ),
    }),
}));
