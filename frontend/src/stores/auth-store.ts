import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (accessToken: string, user: AuthUser) => void;
  updateUser: (user: AuthUser) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      updateUser: (user) => set({ user }),
      clearAuth: () => set({ accessToken: null, user: null }),
      isAuthenticated: () => Boolean(get().accessToken),
    }),
    { name: 'tradenest-auth' },
  ),
);
