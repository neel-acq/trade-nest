import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      updateUser: (user) => set({ user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      isAuthenticated: () => Boolean(get().accessToken),
    }),
    {
      name: 'tradenest-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
