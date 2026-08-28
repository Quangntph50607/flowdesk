import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { LoginRequest, RegisterRequest, AuthResponse } from "@/types";
import type { User } from "@/types";

// Map AuthResponse → User
function toUser(res: AuthResponse): User {
  return {
    id: res.userId,
    email: res.email,
    fullName: res.fullName,
    avatarUrl: res.avatarUrl,
    systemRole: res.systemRole,
    workspaces: res.workspaces ?? [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      const isSuperAdmin = data.systemRole === "SUPER_ADMIN";
      const hasWorkspace = (data.workspaces ?? []).length > 0;

      // Chỉ chặn user không có role nào cả
      if (!isSuperAdmin && !hasWorkspace) {
        throw new Error("Bạn không có quyền truy cập hệ thống này");
      }

      setAuth(data.accessToken, data.refreshToken, toUser(data));
      router.push("/welcome");
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, toUser(data));
      router.push("/welcome");
    },
  });
}

export function useLogout() {
  const { refreshToken, clearAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Nếu không có refreshToken thì không cần gọi API
      if (refreshToken) {
        await authService.logout({ refreshToken });
      }
    },
    onSettled: () => {
      // Luôn clear store và redirect dù API có lỗi hay không
      clearAuth();
      router.push("/login");
    },
  });
}
