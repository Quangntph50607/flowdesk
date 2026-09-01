package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.UpdateUserRequest;
import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.dto.response.UserResponse;
import com.example.flowdesk_be.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  // ================================================================
  // Profile — mọi user đã đăng nhập
  // ================================================================

  @Tag(name = "Profile")
  @Operation(summary = "Lấy thông tin bản thân (kèm workspace memberships)")
  @GetMapping("/api/me")
  public ResponseEntity<ApiResponse<UserResponse>> getMe(
      @AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(
        ApiResponse.success(200, "OK", userService.getMe(userDetails.getUsername())));
  }

  @Tag(name = "Profile")
  @Operation(summary = "Cập nhật profile bản thân")
  @PatchMapping("/api/me")
  public ResponseEntity<ApiResponse<UserResponse>> updateMe(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody UpdateUserRequest request) {
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật thành công",
        userService.updateMe(userDetails.getUsername(), request)));
  }

  // ================================================================
  // SUPER_ADMIN — User management /api/admin/users
  // ================================================================

  @Tag(name = "Admin – Users")
  @Operation(summary = "Danh sách tất cả user")
  @GetMapping("/api/admin/users")
  public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
      @RequestParam(required = false) String search) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK", userService.getAllUsers(search)));
  }

  @Tag(name = "Admin – Users")
  @Operation(summary = "Tìm user theo email")
  @GetMapping("/api/admin/users/by-email")
  public ResponseEntity<ApiResponse<UserResponse>> getUserByEmail(
      @RequestParam String email) {
    return ResponseEntity.ok(
        ApiResponse.success(200, "OK", userService.getUserByEmail(email)));
  }

  @Tag(name = "Admin – Users")
  @Operation(summary = "Chi tiết user theo ID")
  @GetMapping("/api/admin/users/{id}")
  public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK", userService.getUserById(id)));
  }

  @Tag(name = "Admin – Users")
  @Operation(summary = "Cập nhật thông tin user")
  @PatchMapping("/api/admin/users/{id}")
  public ResponseEntity<ApiResponse<UserResponse>> updateUser(
      @PathVariable Long id,
      @Valid @RequestBody UpdateUserRequest request) {
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật thành công",
        userService.updateUser(id, request)));
  }

  @Tag(name = "Admin – Users")
  @Operation(summary = "Bật/tắt tài khoản user")
  @PatchMapping("/api/admin/users/{id}/toggle-active")
  public ResponseEntity<ApiResponse<UserResponse>> toggleActive(@PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật trạng thái thành công",
        userService.toggleActive(id)));
  }
}
