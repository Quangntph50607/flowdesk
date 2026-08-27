package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.LoginRequest;
import com.example.flowdesk_be.dto.request.RefreshTokenRequest;
import com.example.flowdesk_be.dto.request.RegisterRequest;
import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.dto.response.AuthResponse;
import com.example.flowdesk_be.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Đăng ký, đăng nhập, refresh token, logout")
public class AuthController {

  private final AuthService authService;

  @Operation(summary = "Đăng ký tài khoản mới")
  @SecurityRequirements // endpoint này không cần Bearer token
  @PostMapping("/register")
  public ResponseEntity<ApiResponse<AuthResponse>> register(
      @Valid @RequestBody RegisterRequest request) {

    AuthResponse data = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Đăng ký thành công", data));
  }

  @Operation(summary = "Đăng nhập", description = "Trả về accessToken (JWT) và refreshToken (UUID)")
  @SecurityRequirements
  @PostMapping("/login")
  public ResponseEntity<ApiResponse<AuthResponse>> login(
      @Valid @RequestBody LoginRequest request) {

    AuthResponse data = authService.login(request);
    return ResponseEntity.ok(ApiResponse.success(200, "Đăng nhập thành công", data));
  }

  @Operation(summary = "Làm mới access token", description = "Dùng refreshToken để lấy accessToken mới. RefreshToken cũ sẽ bị rotate.")
  @SecurityRequirements
  @PostMapping("/refresh")
  public ResponseEntity<ApiResponse<AuthResponse>> refresh(
      @Valid @RequestBody RefreshTokenRequest request) {

    AuthResponse data = authService.refresh(request);
    return ResponseEntity.ok(ApiResponse.success(200, "Làm mới token thành công", data));
  }

  @Operation(summary = "Đăng xuất thiết bị hiện tại", description = "Revoke refreshToken đang dùng")
  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout(
      @Valid @RequestBody RefreshTokenRequest request) {

    authService.logout(request);
    return ResponseEntity.ok(ApiResponse.success(200, "Đăng xuất thành công", null));
  }

  @Operation(summary = "Đăng xuất tất cả thiết bị", description = "Revoke toàn bộ refreshToken của user hiện tại")
  @PostMapping("/logout-all")
  public ResponseEntity<ApiResponse<Void>> logoutAll(
      @AuthenticationPrincipal UserDetails userDetails) {

    authService.logoutAll(userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Đăng xuất tất cả thiết bị thành công", null));
  }
}
