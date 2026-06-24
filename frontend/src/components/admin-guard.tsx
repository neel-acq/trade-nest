'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { useAuthHydration } from '@/hooks/use-auth-hydration';
import { isProtectedPath } from '@/lib/auth-routes';
import { useAuthStore } from '@/stores/auth-store';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useAuthHydration();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated && isProtectedPath(pathname)) {
      const query = searchParams.toString();
      const from = encodeURIComponent(pathname + (query ? `?${query}` : ''));
      router.replace(`/login?from=${from}`);
      return;
    }

    if (user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [hasHydrated, isAuthenticated, user, router, pathname, searchParams]);

  if (!hasHydrated) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <AuthLoadingScreen message="Redirecting..." />;
  }

  return <>{children}</>;
}
