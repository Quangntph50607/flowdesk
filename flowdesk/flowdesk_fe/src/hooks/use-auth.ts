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
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useLogin() {
  const { setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      // Chỉ SUPER_ADMIN được vào hệ thống này
      if (data.systemRole !== "SUPER_ADMIN") {
        throw new Error("Bạn không có quyền truy cập hệ thống này");
      }

      setAuth(data.accessToken, data.refreshToken, toUser(data));
      router.push("/dashboard");
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
      router.push("/dashboard");
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
      router.push("/login");
    },
  });
}
