import type { WorkspaceInfo } from "./auth";

export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  systemRole: "SUPER_ADMIN" | null;
  workspaces: WorkspaceInfo[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
