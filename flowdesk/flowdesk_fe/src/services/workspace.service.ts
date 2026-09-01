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
  // ── SUPER_ADMIN ──────────────────────────────────────────────────────────
  adminGetAll: async (search?: string): Promise<Workspace[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const { data } = await apiClient.get<ApiResponse<Workspace[]>>(
      `/api/admin/workspaces${params}`,
    );
    return data.data;
  },
  adminGetById: async (id: number): Promise<Workspace> => {
    const { data } = await apiClient.get<ApiResponse<Workspace>>(
      `/api/admin/workspaces/${id}`,
    );
    return data.data;
  },
  adminCreate: async (payload: CreateWorkspaceRequest): Promise<Workspace> => {
    const { data } = await apiClient.post<ApiResponse<Workspace>>(
      "/api/admin/workspaces",
      payload,
    );
    return data.data;
  },
  adminUpdate: async (
    id: number,
    payload: UpdateWorkspaceRequest,
  ): Promise<Workspace> => {
    const { data } = await apiClient.put<ApiResponse<Workspace>>(
      `/api/admin/workspaces/${id}`,
      payload,
    );
    return data.data;
  },
  adminDelete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/workspaces/${id}`);
  },

  // ── OWNER/ADMIN — Workspace ───────────────────────────────────────────────
  getForMember: async (workspaceId: number): Promise<Workspace> => {
    const { data } = await apiClient.get<ApiResponse<Workspace>>(
      `/api/workspaces/${workspaceId}`,
    );
    return data.data;
  },

  // ── OWNER/ADMIN — Branches ────────────────────────────────────────────────
  getBranches: async (parentId: number): Promise<Workspace[]> => {
    const { data } = await apiClient.get<ApiResponse<Workspace[]>>(
      `/api/workspaces/${parentId}/branches`,
    );
    return data.data;
  },
  createBranch: async (
    parentId: number,
    payload: CreateWorkspaceRequest,
  ): Promise<Workspace> => {
    const { data } = await apiClient.post<ApiResponse<Workspace>>(
      `/api/workspaces/${parentId}/branches`,
      payload,
    );
    return data.data;
  },
  updateBranch: async (
    parentId: number,
    branchId: number,
    payload: UpdateWorkspaceRequest,
  ): Promise<Workspace> => {
    const { data } = await apiClient.put<ApiResponse<Workspace>>(
      `/api/workspaces/${parentId}/branches/${branchId}`,
      payload,
    );
    return data.data;
  },
  deleteBranch: async (parentId: number, branchId: number): Promise<void> => {
    await apiClient.delete(`/api/workspaces/${parentId}/branches/${branchId}`);
  },

  // ── OWNER/ADMIN — Members ────────────────────────────────────────────────
  getMembers: async (workspaceId: number): Promise<WorkspaceMember[]> => {
    const { data } = await apiClient.get<ApiResponse<WorkspaceMember[]>>(
      `/api/workspaces/${workspaceId}/members`,
    );
    return data.data;
  },
  addMember: async (
    workspaceId: number,
    payload: AddMemberRequest,
  ): Promise<WorkspaceMember> => {
    const { data } = await apiClient.post<ApiResponse<WorkspaceMember>>(
      `/api/workspaces/${workspaceId}/members`,
      payload,
    );
    return data.data;
  },
  toggleMemberActive: async (
    workspaceId: number,
    memberId: number,
  ): Promise<WorkspaceMember> => {
    const { data } = await apiClient.patch<ApiResponse<WorkspaceMember>>(
      `/api/workspaces/${workspaceId}/members/${memberId}/toggle-active`,
    );
    return data.data;
  },
  removeMember: async (
    workspaceId: number,
    memberId: number,
  ): Promise<void> => {
    await apiClient.delete(
      `/api/workspaces/${workspaceId}/members/${memberId}`,
    );
  },
};
