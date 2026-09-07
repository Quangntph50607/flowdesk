// ========================
// Auth
// ========================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ========================
// User
// ========================
export interface User {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: "SUPER_ADMIN" | "USER";
  active: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  avatarUrl?: string;
}

// ========================
// Workspace
// ========================
export interface Workspace {
  id: number;
  name: string;
  description?: string;
  ownerEmail?: string;
  ownerFullName?: string;
  active: boolean;
  branches?: Workspace[];
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

// ========================
// Member
// ========================
export interface Member {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  active: boolean;
}

export interface AddMemberRequest {
  email: string;
  role: "ADMIN" | "MEMBER";
}

// ========================
// API Response wrapper
// ========================
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}
