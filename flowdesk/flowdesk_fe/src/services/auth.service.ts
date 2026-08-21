import { apiClient } from "@/lib/api";
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
} from "@/types";

export const authService = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      "/api/auth/login",
      payload,
    );
    return data.data;
  },

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      "/api/auth/register",
      payload,
    );
    return data.data;
  },

  refresh: async (payload: RefreshTokenRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>(
      "/api/auth/refresh",
      payload,
    );
    return data.data;
  },

  logout: async (payload: RefreshTokenRequest): Promise<void> => {
    await apiClient.post("/api/auth/logout", payload);
  },

  logoutAll: async (): Promise<void> => {
    await apiClient.post("/api/auth/logout-all");
  },
};
