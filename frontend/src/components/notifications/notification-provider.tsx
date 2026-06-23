'use client';

import { useEffect } from 'react';
import { useRealtimeStatus } from '@/components/realtime/realtime-provider';
import { fetchNotifications, fetchUnreadCount } from '@/lib/notifications';
import { REALTIME_EVENTS } from '@/lib/realtime-events';
import { getRealtimeSocket } from '@/lib/socket';
import type { SafeNotification } from '@/types';
import { useNotificationStore } from '@/stores/notification-store';
import { ToastStack } from './toast-stack';

function parseNotification(payload: Record<string, unknown>): SafeNotification {
  return payload as unknown as SafeNotification;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { connected } = useRealtimeStatus();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const incrementUnread = useNotificationStore((state) => state.incrementUnread);
  const pushToast = useNotificationStore((state) => state.pushToast);
  const prependRecent = useNotificationStore((state) => state.prependRecent);
  const setRecent = useNotificationStore((state) => state.setRecent);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const [countResult, listResult] = await Promise.all([
          fetchUnreadCount(),
          fetchNotifications({ page: 1, limit: 10 }),
        ]);
        if (cancelled) return;
        setUnreadCount(countResult.count);
        setRecent(listResult.data);
      } catch {
        // ignore when unauthenticated or offline
      }
    }

    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [setUnreadCount, setRecent]);

  useEffect(() => {
    if (!connected) return;

    const socket = getRealtimeSocket();
    if (!socket) return;

    const handleNotification = (payload: Record<string, unknown>) => {
      const notification = parseNotification(payload);
      incrementUnread();
      prependRecent(notification);
      pushToast({
        title: notification.title,
        message: notification.message,
        link: notification.link,
      });
    };

    socket.on(REALTIME_EVENTS.NOTIFICATION_CREATED, handleNotification);
    return () => {
      socket.off(REALTIME_EVENTS.NOTIFICATION_CREATED, handleNotification);
    };
  }, [connected, incrementUnread, prependRecent, pushToast]);

  return (
    <>
      {children}
      <ToastStack />
    </>
  );
}
