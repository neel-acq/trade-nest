'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { useAuthHydration } from '@/hooks/use-auth-hydration';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useAuthHydration();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <AuthLoadingScreen message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
