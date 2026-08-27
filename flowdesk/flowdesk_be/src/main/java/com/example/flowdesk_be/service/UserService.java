package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.UpdateUserRequest;
import com.example.flowdesk_be.dto.response.UserResponse;

import java.util.List;

public interface UserService {

  // Lấy thông tin user hiện tại (từ JWT)
  UserResponse getMe(String email);

  // Cập nhật profile bản thân
  UserResponse updateMe(String email, UpdateUserRequest request);

  // ---- SUPER_ADMIN only ----

  List<UserResponse> getAllUsers();

  UserResponse getUserById(Long id);

  UserResponse updateUser(Long id, UpdateUserRequest request);

  UserResponse toggleActive(Long id);
}
