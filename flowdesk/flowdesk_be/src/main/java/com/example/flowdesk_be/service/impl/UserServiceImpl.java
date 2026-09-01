package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.UpdateUserRequest;
import com.example.flowdesk_be.dto.response.UserResponse;
import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.UserRepository;
import com.example.flowdesk_be.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;

  @Override
  public UserResponse getMe(String email) {
    // Kèm workspaces để FE cập nhật store sau khi refresh profile
    return UserResponse.fromWithWorkspaces(findByEmailOrThrow(email));
  }

  @Override
  @Transactional
  public UserResponse updateMe(String email, UpdateUserRequest request) {
    User user = findByEmailOrThrow(email);
    applyUpdate(user, request);
    return UserResponse.fromWithWorkspaces(userRepository.save(user));
  }

  @Override
  public List<UserResponse> getAllUsers() {
    return userRepository.findAll().stream().map(UserResponse::from).toList();
  }

  @Override
  public List<UserResponse> getAllUsers(String search) {
    if (search == null || search.isBlank())
      return getAllUsers();
    return userRepository
        .findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(search, search)
        .stream().map(UserResponse::from).toList();
  }

  @Override
  public UserResponse getUserById(Long id) {
    return UserResponse.from(findByIdOrThrow(id));
  }

  @Override
  public UserResponse getUserByEmail(String email) {
    return UserResponse.from(findByEmailOrThrow(email));
  }

  @Override
  @Transactional
  public UserResponse updateUser(Long id, UpdateUserRequest request) {
    User user = findByIdOrThrow(id);
    applyUpdate(user, request);
    return UserResponse.from(userRepository.save(user));
  }

  @Override
  @Transactional
  public UserResponse toggleActive(Long id) {
    User user = findByIdOrThrow(id);

    if (user.isSuperAdmin()) {
      throw AppException.forbidden("Không thể khoá tài khoản SUPER_ADMIN");
    }

    user.setIsActive(!user.getIsActive());
    return UserResponse.from(userRepository.save(user));
  }

  // ---- helpers ----

  private User findByEmailOrThrow(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));
  }

  private User findByIdOrThrow(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user id: " + id));
  }

  private void applyUpdate(User user, UpdateUserRequest request) {
    if (request.getFullName() != null && !request.getFullName().isBlank()) {
      user.setFullName(request.getFullName());
    }
    if (request.getAvatarUrl() != null) {
      user.setAvatarUrl(request.getAvatarUrl());
    }
  }
}
