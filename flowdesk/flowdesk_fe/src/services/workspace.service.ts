import { apiClient } from "@/lib/api";
import type {
  ApiResponse,
  Workspace,
  WorkspaceMember,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  AddMemberRequest,
} from "@/types";

export const workspaceService = {
  // ── Workspace cha (SUPER_ADMIN) ──
  getAll: async (): Promise<Workspace[]> => {
    const { data } = await apiClient.get<ApiResponse<Workspace[]>>(
      "/api/admin/workspaces",
    );
    return data.data;
  },

  getById: async (id: number): Promise<Workspace> => {
    const { data } = await apiClient.get<ApiResponse<Workspace>>(
      `/api/admin/workspaces/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateWorkspaceRequest): Promise<Workspace> => {
    const { data } = await apiClient.post<ApiResponse<Workspace>>(
      "/api/admin/workspaces",
      payload,
    );
    return data.data;
  },

  update: async (
    id: number,
    payload: UpdateWorkspaceRequest,
  ): Promise<Workspace> => {
    const { data } = await apiClient.put<ApiResponse<Workspace>>(
      `/api/admin/workspaces/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/workspaces/${id}`);
  },

  // ── Branch (chi nhánh) ──
  // Lấy workspace theo ID — dành cho ADMIN (không cần quyền /admin/)
  getByIdForMember: async (id: number): Promise<Workspace> => {
    const { data } = await apiClient.get<ApiResponse<Workspace>>(
      `/api/workspace/${id}`,
    );
    return data.data;
  },

  getBranches: async (workspaceId: number): Promise<Workspace[]> => {
    const { data } = await apiClient.get<ApiResponse<Workspace[]>>(
      `/api/workspace/${workspaceId}/branches`,
    );
    return data.data;
  },

  createBranch: async (
    workspaceId: number,
    payload: CreateWorkspaceRequest,
  ): Promise<Workspace> => {
    const { data } = await apiClient.post<ApiResponse<Workspace>>(
      `/api/workspace/${workspaceId}/branches`,
      payload,
    );
    return data.data;
  },

  updateBranch: async (
    workspaceId: number,
    branchId: number,
    payload: UpdateWorkspaceRequest,
  ): Promise<Workspace> => {
    const { data } = await apiClient.put<ApiResponse<Workspace>>(
      `/api/workspace/${workspaceId}/branches/${branchId}`,
      payload,
    );
    return data.data;
  },

  deleteBranch: async (
    workspaceId: number,
    branchId: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/api/workspace/${workspaceId}/branches/${branchId}`,
    );
  },

  // ── Members ──
  getMembers: async (workspaceId: number): Promise<WorkspaceMember[]> => {
    const { data } = await apiClient.get<ApiResponse<WorkspaceMember[]>>(
      `/api/workspace/${workspaceId}/members`,
    );
    return data.data;
  },

  addMember: async (
    workspaceId: number,
    payload: AddMemberRequest,
  ): Promise<WorkspaceMember> => {
    const { data } = await apiClient.post<ApiResponse<WorkspaceMember>>(
      `/api/workspace/${workspaceId}/members`,
      payload,
    );
    return data.data;
  },

  removeMember: async (
    workspaceId: number,
    memberId: number,
  ): Promise<void> => {
    await apiClient.delete(`/api/workspace/${workspaceId}/members/${memberId}`);
  },

  toggleMember: async (
    workspaceId: number,
    memberId: number,
  ): Promise<WorkspaceMember> => {
    const { data } = await apiClient.patch<ApiResponse<WorkspaceMember>>(
      `/api/workspace/${workspaceId}/members/${memberId}/toggle-active`,
    );
    return data.data;
  },
};
