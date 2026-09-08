package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.UpdateUserRequest;
import com.example.flowdesk_be.dto.response.UserResponse;

import java.util.List;

public interface UserService {
  UserResponse getMe(String email);

  UserResponse updateMe(String email, UpdateUserRequest request);

  List<UserResponse> getAllUsers();

  List<UserResponse> getAllUsers(String search);

  UserResponse getUserById(Long id);

  UserResponse updateUser(Long id, UpdateUserRequest request);

  UserResponse toggleActive(Long id);

  UserResponse getUserByEmail(String email);

  /**
   * Danh sách user active, chưa là member của workspace chỉ định.
   * Dùng cho dialog "Thêm thành viên" — accessible bởi OWNER/ADMIN, không chỉ
   * SUPER_ADMIN.
   */
  List<UserResponse> getAvailableUsersForWorkspace(Long workspaceId, String search);
}
