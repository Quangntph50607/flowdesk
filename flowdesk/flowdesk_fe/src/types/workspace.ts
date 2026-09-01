export interface Workspace {
  id: number;
  name: string;
  slug: string;
  ownerId: number;
  ownerName: string;
  parentId: number | null; // null = workspace tổng
  level: number; // 0 = tổng, 1 = chi nhánh
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Workspace[]; // chi nhánh, populate khi cần
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  roleCode: "OWNER" | "ADMIN" | "AGENT";
  roleName: string;
  workspaceId: number;
  workspaceName: string;
  isActive: boolean;
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  ownerEmail?: string; // SUPER_ADMIN chỉ định owner; nếu trống thì dùng requester
}

export interface UpdateWorkspaceRequest {
  name: string;
}

export interface AddMemberRequest {
  userId: number;
  roleCode: "OWNER" | "ADMIN" | "AGENT";
}
