package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.UpdateUserRequest;
import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.dto.response.UserResponse;
import com.example.flowdesk_be.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

  @Tag(name = "Profile", description = "Thông tin tài khoản cá nhân")
  @Operation(summary = "Lấy thông tin bản thân")
  @GetMapping("/api/me")
  public ResponseEntity<ApiResponse<UserResponse>> getMe(
      @AuthenticationPrincipal UserDetails userDetails) {

    UserResponse data = userService.getMe(userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "OK", data));
  }

  @Tag(name = "Profile")
  @Operation(summary = "Cập nhật profile bản thân", description = "Chỉ cập nhật fullName và/hoặc avatarUrl")
  @PatchMapping("/api/me")
  public ResponseEntity<ApiResponse<UserResponse>> updateMe(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody UpdateUserRequest request) {

    UserResponse data = userService.updateMe(userDetails.getUsername(), request);
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật thành công", data));
  }

  // ================================================================
  // SUPER_ADMIN — User management (/api/admin/users)
  // ================================================================

  @Tag(name = "Admin - Users", description = "Quản lý user — chỉ SUPER_ADMIN")
  @Operation(summary = "Lấy danh sách tất cả user")
  @GetMapping("/api/admin/users")
  public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
    return ResponseEntity.ok(ApiResponse.success(200, "OK", userService.getAllUsers()));
  }

  @Tag(name = "Admin - Users")
  @Operation(summary = "Lấy thông tin user theo ID")
  @GetMapping("/api/admin/users/{id}")
  public ResponseEntity<ApiResponse<UserResponse>> getUserById(
      @Parameter(description = "ID của user") @PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK", userService.getUserById(id)));
  }

  @Tag(name = "Admin - Users")
  @Operation(summary = "Cập nhật thông tin user")
  @PatchMapping("/api/admin/users/{id}")
  public ResponseEntity<ApiResponse<UserResponse>> updateUser(
      @Parameter(description = "ID của user") @PathVariable Long id,
      @Valid @RequestBody UpdateUserRequest request) {

    UserResponse data = userService.updateUser(id, request);
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật thành công", data));
  }

  @Tag(name = "Admin - Users")
  @Operation(summary = "Bật/tắt trạng thái tài khoản user", description = "Toggle is_active. Không áp dụng được cho SUPER_ADMIN.")
  @PatchMapping("/api/admin/users/{id}/toggle-active")
  public ResponseEntity<ApiResponse<UserResponse>> toggleActive(
      @Parameter(description = "ID của user") @PathVariable Long id) {
    UserResponse data = userService.toggleActive(id);
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật trạng thái thành công", data));
  }
}
