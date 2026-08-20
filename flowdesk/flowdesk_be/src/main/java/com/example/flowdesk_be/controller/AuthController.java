package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.LoginRequest;
import com.example.flowdesk_be.dto.request.RefreshTokenRequest;
import com.example.flowdesk_be.dto.request.RegisterRequest;
import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.dto.response.AuthResponse;
import com.example.flowdesk_be.service.AuthService;
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
public class AuthController {

  private final AuthService authService;

  // Đăng ký — trả về cả access + refresh token
  @PostMapping("/register")
  public ResponseEntity<ApiResponse<AuthResponse>> register(
      @Valid @RequestBody RegisterRequest request) {

    AuthResponse data = authService.register(request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Đăng ký thành công", data));
  }

  // Đăng nhập — trả về cả access + refresh token
  @PostMapping("/login")
  public ResponseEntity<ApiResponse<AuthResponse>> login(
      @Valid @RequestBody LoginRequest request) {

    AuthResponse data = authService.login(request);
    return ResponseEntity.ok(ApiResponse.success(200, "Đăng nhập thành công", data));
  }

  // Dùng refresh token để lấy access token mới (có rotate refresh token)
  @PostMapping("/refresh")
  public ResponseEntity<ApiResponse<AuthResponse>> refresh(
      @Valid @RequestBody RefreshTokenRequest request) {

    AuthResponse data = authService.refresh(request);
    return ResponseEntity.ok(ApiResponse.success(200, "Làm mới token thành công", data));
  }

  // Logout thiết bị hiện tại — revoke refresh token đang dùng
  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout(
      @Valid @RequestBody RefreshTokenRequest request) {

    authService.logout(request);
    return ResponseEntity.ok(ApiResponse.success(200, "Đăng xuất thành công", null));
  }

  // Logout tất cả thiết bị — revoke toàn bộ refresh token của user
  @PostMapping("/logout-all")
  public ResponseEntity<ApiResponse<Void>> logoutAll(
      @AuthenticationPrincipal UserDetails userDetails) {

    authService.logoutAll(userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Đăng xuất tất cả thiết bị thành công", null));
  }
}
