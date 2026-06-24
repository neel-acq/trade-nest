'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { useAuthHydration } from '@/hooks/use-auth-hydration';
import { useAuthStore } from '@/stores/auth-store';

/** Redirects authenticated users away from public-only routes (e.g. login). */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useAuthHydration();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    return <AuthLoadingScreen message="Redirecting to dashboard..." />;
  }

  return <>{children}</>;
}
