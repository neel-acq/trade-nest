import { Suspense } from 'react';
import { GuestGuard } from '@/components/guest-guard';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AuthLoadingScreen message="Loading..." />}>
      <GuestGuard>{children}</GuestGuard>
    </Suspense>
  );
}
