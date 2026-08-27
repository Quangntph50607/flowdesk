package com.example.flowdesk_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {

  private String accessToken; // JWT — sống ngắn (24h)
  private String refreshToken; // UUID — sống dài (7 ngày)
  private String tokenType; // "Bearer"
  private Long userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private String systemRole; // "SUPER_ADMIN" hoặc null
}
