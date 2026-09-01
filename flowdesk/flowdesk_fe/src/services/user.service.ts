import { apiClient } from "@/lib/api";
import type { ApiResponse, User } from "@/types";
import type { RegisterRequest } from "@/types/auth";

// UserResponse từ BE dùng cho admin list (không có workspaces)
export interface UserRecord {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  systemRole: "SUPER_ADMIN" | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>("/api/me");
    return data.data;
  },
  updateMe: async (payload: {
    fullName?: string;
    avatarUrl?: string;
  }): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      "/api/me",
      payload,
    );
    return data.data;
  },

  // ── SUPER_ADMIN ──────────────────────────────────────────────────────────
  adminGetAll: async (search?: string): Promise<UserRecord[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await apiClient.get<ApiResponse<UserRecord[]>>(
      `/api/admin/users${params}`,
    );
    return data.data;
  },
  adminGetById: async (id: number): Promise<UserRecord> => {
    const { data } = await apiClient.get<ApiResponse<UserRecord>>(
      `/api/admin/users/${id}`,
    );
    return data.data;
  },
  adminGetByEmail: async (email: string): Promise<UserRecord> => {
    const { data } = await apiClient.get<ApiResponse<UserRecord>>(
      `/api/admin/users/by-email?email=${encodeURIComponent(email)}`,
    );
    return data.data;
  },
  adminToggleActive: async (id: number): Promise<UserRecord> => {
    const { data } = await apiClient.patch<ApiResponse<UserRecord>>(
      `/api/admin/users/${id}/toggle-active`,
    );
    return data.data;
  },

  // Tạo user mới (SUPER_ADMIN dùng register endpoint)
  adminCreate: async (payload: RegisterRequest): Promise<UserRecord> => {
    const { data } = await apiClient.post<ApiResponse<UserRecord>>(
      "/api/auth/register",
      payload,
    );
    return data.data;
  },
};
