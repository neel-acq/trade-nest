'use client';

import { AuthGuard } from '@/components/auth-guard';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { NotificationProvider } from '@/components/notifications/notification-provider';
import { RealtimeProvider } from '@/components/realtime/realtime-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <RealtimeProvider>
        <NotificationProvider>
          <DashboardShell>{children}</DashboardShell>
        </NotificationProvider>
      </RealtimeProvider>
    </AuthGuard>
  );
}
