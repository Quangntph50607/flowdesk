package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.LoginRequest;
import com.example.flowdesk_be.dto.request.RefreshTokenRequest;
import com.example.flowdesk_be.dto.request.RegisterRequest;
import com.example.flowdesk_be.dto.response.AuthResponse;

public interface AuthService {

  AuthResponse register(RegisterRequest request);

  AuthResponse login(LoginRequest request);

  // Dùng refresh token để lấy access token mới
  AuthResponse refresh(RefreshTokenRequest request);

  // Logout thiết bị hiện tại — revoke refresh token đang dùng
  void logout(RefreshTokenRequest request);

  // Logout tất cả thiết bị — revoke toàn bộ refresh token của user
  void logoutAll(String email);
}
