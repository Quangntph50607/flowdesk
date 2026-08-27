import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

// Set / clear cookie để middleware đọc được
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  isSuperAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (accessToken, refreshToken, user) => {
        // Set cookie để middleware nhận ra đã đăng nhập
        setCookie("auth_token", refreshToken, 7);
        set({ accessToken, refreshToken, user });
      },

      setTokens: (accessToken, refreshToken) => {
        setCookie("auth_token", refreshToken, 7);
        set({ accessToken, refreshToken });
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        clearCookie("auth_token");
        set({ user: null, accessToken: null, refreshToken: null });
      },

      isAuthenticated: () => !!get().accessToken,

      isSuperAdmin: () => get().user?.systemRole === "SUPER_ADMIN",
    }),
    {
      name: "flowdesk-auth",
      // Persist refreshToken + user — accessToken vẫn in-memory
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
