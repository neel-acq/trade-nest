'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

/** Ensures persisted auth state is loaded before rendering auth-dependent UI. */
export function useAuthHydration() {
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, [setHasHydrated]);
}
