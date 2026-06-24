'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationTypeClass,
} from '@/lib/notifications';
import { useNotificationStore } from '@/stores/notification-store';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const recent = useNotificationStore((state) => state.recent);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const setRecent = useNotificationStore((state) => state.setRecent);
  const markRecentRead = useNotificationStore((state) => state.markRecentRead);
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);

  useEffect(() => {
    if (!open) return;

    fetchNotifications({ page: 1, limit: 10 })
      .then((result) => setRecent(result.data))
      .catch(() => undefined);
  }, [open, setRecent]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      markRecentRead(id);
      decrementUnread();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllNotificationsRead();
      setUnreadCount(0);
      setRecent(recent.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      if (result.updated === 0) return;
    } catch {
      // ignore
    }
  };

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        className="relative px-2"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full bg-destructive text-destructive-foreground text-[10px] leading-none flex items-center justify-center px-1">
            {badge}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(calc(100vw-1.5rem),20rem)] sm:w-80 rounded-md border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="font-medium text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications yet</p>
            ) : (
              recent.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b px-4 py-3 text-sm ${notification.isRead ? 'opacity-70' : 'bg-muted/30'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`font-medium ${notificationTypeClass(notification.type)}`}>
                        {notification.title}
                      </p>
                      <p className="text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline shrink-0"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        Read
                      </button>
                    )}
                  </div>
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                      onClick={() => setOpen(false)}
                    >
                      Open
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t px-4 py-2">
            <Link
              href="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
