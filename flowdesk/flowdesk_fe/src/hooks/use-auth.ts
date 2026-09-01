"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { LoginRequest, RegisterRequest, AuthResponse } from "@/types";

// Cookie helpers — middleware dùng cookie vì localStorage không đọc được ở server
function setAuthCookie(value: string) {
  // httpOnly=false vì cần đọc từ client khi logout
  // SameSite=Lax đủ cho SPA cùng origin
  document.cookie = `flowdesk-token=${value}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = "flowdesk-token=; path=/; max-age=0; SameSite=Lax";
}

function getRedirectPath(auth: AuthResponse): string {
  if (auth.systemRole === "SUPER_ADMIN") return "/dashboard";
  const ownerOrAdmin = auth.workspaces.find(
    (w) =>
      (w.roleCode === "OWNER" || w.roleCode === "ADMIN") && w.parentId === null,
  );
  if (ownerOrAdmin) return "/admin-workspace";
  const hasAgent = auth.workspaces.some((w) => w.roleCode === "AGENT");
  if (hasAgent) return "/agent";
  return "/welcome";
}

export function useLogin() {
  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser({
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        systemRole: data.systemRole,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspaces: data.workspaces,
      });
      setAuthCookie(data.accessToken);
      router.push(getRedirectPath(data));
    },
  });
}

export function useRegister() {
  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      setUser({
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        systemRole: data.systemRole,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspaces: data.workspaces,
      });
      setAuthCookie(data.accessToken);
      router.push(getRedirectPath(data));
    },
  });
}

export function useLogout() {
  const { refreshToken, clearAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logout({ refreshToken: refreshToken ?? "" }),
    onSettled: () => {
      clearAuth();
      clearAuthCookie();
      router.push("/login");
    },
  });
}
