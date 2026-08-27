import { apiClient } from "@/lib/api";
import type { ApiResponse, User } from "@/types";

export interface UpdateUserRequest {
  fullName?: string;
  avatarUrl?: string;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    const { data } =
      await apiClient.get<ApiResponse<User[]>>("/api/admin/users");
    return data.data;
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>(
      `/api/admin/users/${id}`,
    );
    return data.data;
  },

  update: async (id: number, payload: UpdateUserRequest): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/api/admin/users/${id}`,
      payload,
    );
    return data.data;
  },

  toggleActive: async (id: number): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/api/admin/users/${id}/toggle-active`,
    );
    return data.data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>("/api/me");
    return data.data;
  },

  updateMe: async (payload: UpdateUserRequest): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      "/api/me",
      payload,
    );
    return data.data;
  },
};
