'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { useAuthHydration } from '@/hooks/use-auth-hydration';
import { isProtectedPath } from '@/lib/auth-routes';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useAuthHydration();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated && isProtectedPath(pathname)) {
      const query = searchParams.toString();
      const from = encodeURIComponent(pathname + (query ? `?${query}` : ''));
      router.replace(`/login?from=${from}`);
    }
  }, [hasHydrated, isAuthenticated, pathname, router, searchParams]);

  if (!hasHydrated) {
    return <AuthLoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <AuthLoadingScreen message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
