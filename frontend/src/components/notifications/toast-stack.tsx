'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notification-store';

export function ToastStack() {
  const toasts = useNotificationStore((state) => state.toasts);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), 6000),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-lg border bg-card p-4 shadow-lg animate-in slide-in-from-right"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm">{toast.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>
              {toast.link && (
                <Link
                  href={toast.link}
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                  onClick={() => dismissToast(toast.id)}
                >
                  View details
                </Link>
              )}
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs shrink-0"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
