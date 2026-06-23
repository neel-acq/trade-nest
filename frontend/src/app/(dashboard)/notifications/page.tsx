'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationTypeClass,
} from '@/lib/notifications';
import { useNotificationStore } from '@/stores/notification-store';
import type { SafeNotification } from '@/types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SafeNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const decrementUnread = useNotificationStore((state) => state.decrementUnread);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchNotifications({
        page,
        limit,
        ...(filter === 'unread' ? { isRead: false } : {}),
      });
      setNotifications(result.data);
      setTotal(result.meta.total);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      decrementUnread();
      load();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      load();
    } catch {
      // ignore
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">Orders, trades, and wallet activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
          Mark all read
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setFilter('unread');
            setPage(1);
          }}
        >
          Unread
        </Button>
      </div>

      <div className="rounded-md border divide-y">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No notifications found.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex items-start justify-between gap-4 ${notification.isRead ? '' : 'bg-muted/30'}`}
            >
              <div className="min-w-0">
                <p className={`font-medium ${notificationTypeClass(notification.type)}`}>
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
                {notification.link && (
                  <Link href={notification.link} className="text-xs text-primary hover:underline mt-2 inline-block">
                    View related page
                  </Link>
                )}
              </div>
              {!notification.isRead && (
                <Button variant="outline" size="sm" onClick={() => handleMarkRead(notification.id)}>
                  Mark read
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
