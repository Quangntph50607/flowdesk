export interface Workspace {
  id: number;
  name: string;
  slug: string;
  ownerId: number;
  ownerName: string;
  parentId: number | null;
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Workspace[];
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  roleCode: "ADMIN" | "AGENT";
  roleName: string;
  workspaceId: number;
  workspaceName: string;
  isActive: boolean;
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  slug: string;
}

export interface UpdateWorkspaceRequest {
  name: string;
}

export interface AddMemberRequest {
  userId: number;
  roleCode: "ADMIN" | "AGENT";
}
