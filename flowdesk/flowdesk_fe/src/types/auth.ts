// ===== Requests =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ===== Workspace membership (trong AuthResponse) =====
export interface WorkspaceInfo {
  workspaceId: number;
  workspaceName: string;
  workspaceSlug: string;
  parentId: number | null; // null = workspace tổng, non-null = chi nhánh
  roleCode: "OWNER" | "ADMIN" | "AGENT";
}

// ===== Responses =====
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  systemRole: "SUPER_ADMIN" | null;
  workspaces: WorkspaceInfo[];
}

export interface ApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}
