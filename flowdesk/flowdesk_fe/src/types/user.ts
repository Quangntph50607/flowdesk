export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  systemRole: "SUPER_ADMIN" | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
