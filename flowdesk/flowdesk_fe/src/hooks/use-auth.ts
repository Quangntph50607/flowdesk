import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { LoginRequest, RegisterRequest } from "@/types";

export function useLogin() {
  const { setTokens } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const { setTokens } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
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
