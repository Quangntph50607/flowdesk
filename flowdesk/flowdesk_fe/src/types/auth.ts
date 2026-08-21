// ===== Request types =====
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

// ===== Response types =====
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}
