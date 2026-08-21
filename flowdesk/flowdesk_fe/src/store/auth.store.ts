import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: "flowdesk-auth",
      // Chỉ persist refreshToken — accessToken lưu in-memory
      partialize: (state) => ({ refreshToken: state.refreshToken }),
    },
  ),
);
