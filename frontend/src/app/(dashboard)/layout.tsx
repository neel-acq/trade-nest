'use client';

import { Suspense } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { NotificationProvider } from '@/components/notifications/notification-provider';
import { RealtimeProvider } from '@/components/realtime/realtime-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoadingScreen message="Loading..." />}>
      <AuthGuard>
        <RealtimeProvider>
          <NotificationProvider>
            <DashboardShell>{children}</DashboardShell>
          </NotificationProvider>
        </RealtimeProvider>
      </AuthGuard>
    </Suspense>
  );
}
