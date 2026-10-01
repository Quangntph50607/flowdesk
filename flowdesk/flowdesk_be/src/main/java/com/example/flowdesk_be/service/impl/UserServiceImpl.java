package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.UpdateUserRequest;
import com.example.flowdesk_be.dto.response.PageResponse;
import com.example.flowdesk_be.dto.response.UserResponse;
import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.UserRepository;
import com.example.flowdesk_be.service.UserService;
import com.example.flowdesk_be.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private static final Pattern PHONE_PATTERN = Pattern.compile("0\\d{9,10}");

  private final UserRepository userRepository;
  private final StorageService storageService;

  @Value("${app.storage.b2.bucket-name}")
  private String bucketName;

  @Override
  public UserResponse getMe(String email) {
    // Kèm workspaces để FE cập nhật store sau khi refresh profile
    return withResolvedAvatar(UserResponse.fromWithWorkspaces(findByEmailOrThrow(email)));
  }

  @Override
  @Transactional
  public UserResponse updateMe(String email, UpdateUserRequest request) {
    User user = findByEmailOrThrow(email);
    applyUpdate(user, request);
    return withResolvedAvatar(UserResponse.fromWithWorkspaces(userRepository.save(user)));
  }

  @Override
  public PageResponse<UserResponse> getAllUsers(String search, Integer limit, Integer pageNumber) {
    PageRequest pageable = toPageRequest(limit, pageNumber);
    Page<User> page = (search == null || search.isBlank())
        ? userRepository.findAll(pageable)
        : userRepository.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(search, search, pageable);
    return PageResponse.of(
        page.getContent().stream().map(user -> withResolvedAvatar(UserResponse.from(user))).toList(),
        page.getTotalElements(),
        pageable.getPageSize(),
        safePage(pageNumber));
  }

  @Override
  public UserResponse getUserById(Long id) {
    return withResolvedAvatar(UserResponse.from(findByIdOrThrow(id)));
  }

  @Override
  public UserResponse getUserByEmail(String email) {
    return withResolvedAvatar(UserResponse.from(findByEmailOrThrow(email)));
  }

  @Override
  public PageResponse<UserResponse> getAvailableUsersForWorkspace(Long workspaceId, String search, Integer limit,
      Integer pageNumber) {
    PageRequest pageable = toPageRequest(limit, pageNumber);
    Page<User> page = userRepository.findAvailableForWorkspace(workspaceId, search == null ? "" : search, pageable);
    return PageResponse.of(
        page.getContent().stream().map(user -> withResolvedAvatar(UserResponse.from(user))).toList(),
        page.getTotalElements(),
        pageable.getPageSize(),
        safePage(pageNumber));
  }

  @Override
  @Transactional
  public UserResponse updateUser(Long id, UpdateUserRequest request) {
    User user = findByIdOrThrow(id);
    applyUpdate(user, request);
    return withResolvedAvatar(UserResponse.from(userRepository.save(user)));
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

  private UserResponse withResolvedAvatar(UserResponse response) {
    String avatarUrl = response.getAvatarUrl();
    if (avatarUrl == null || !avatarUrl.contains("backblazeb2.com")) {
      return response;
    }

    try {
      java.net.URI uri = java.net.URI.create(avatarUrl);
      String path = uri.getPath();
      String fileKey = extractFileKey(path);
      if (fileKey != null) {
        response.setAvatarUrl(storageService.generatePresignedUrl(fileKey));
      }
    } catch (Exception ignored) {
      // Keep the stored URL if presigning temporarily fails.
    }
    return response;
  }

  private String extractFileKey(String path) {
    String normalized = path.startsWith("/") ? path.substring(1) : path;
    String bucketPrefix = bucketName + "/";
    return normalized.startsWith(bucketPrefix)
        ? normalized.substring(bucketPrefix.length())
        : normalized;
  }

  private PageRequest toPageRequest(Integer limit, Integer pageNumber) {
    int safeLimit = Math.min(Math.max(limit == null ? 10 : limit, 1), 100);
    return PageRequest.of(safePage(pageNumber) - 1, safeLimit);
  }

  private int safePage(Integer pageNumber) {
    return Math.max(pageNumber == null ? 1 : pageNumber, 1);
  }

  private void applyUpdate(User user, UpdateUserRequest request) {
    if (request.getFullName() != null && !request.getFullName().isBlank()) {
      user.setFullName(request.getFullName());
    }
    if (request.getAvatarUrl() != null) {
      user.setAvatarUrl(blankToNull(stripSignedQuery(request.getAvatarUrl())));
    }
    if (request.getPhone() != null) {
      String phone = blankToNull(request.getPhone());
      String phoneNormalized = normalizePhoneOrThrow(phone);
      if (phoneNormalized != null
          && userRepository.existsByPhoneNormalizedAndIdNot(phoneNormalized, user.getId())) {
        throw AppException.conflict("Số điện thoại đã được sử dụng");
      }
      user.setPhone(phone);
      user.setPhoneNormalized(phoneNormalized);
    }
    if (request.getAddress() != null) {
      user.setAddress(blankToNull(request.getAddress()));
    }
    if (request.getDateOfBirth() != null) {
      user.setDateOfBirth(request.getDateOfBirth());
    }
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private String normalizePhoneOrThrow(String phone) {
    if (phone == null) {
      return null;
    }

    String normalized = phone.replaceAll("[\\s.\\-()]", "");
    if (normalized.startsWith("+84")) {
      normalized = "0" + normalized.substring(3);
    } else if (normalized.startsWith("84")) {
      normalized = "0" + normalized.substring(2);
    }

    if (!PHONE_PATTERN.matcher(normalized).matches()) {
      throw AppException.badRequest("Số điện thoại không đúng định dạng");
    }

    return normalized;
  }

  private String stripSignedQuery(String avatarUrl) {
    if (!avatarUrl.contains("backblazeb2.com")) {
      return avatarUrl;
    }
    int queryStart = avatarUrl.indexOf('?');
    return queryStart >= 0 ? avatarUrl.substring(0, queryStart) : avatarUrl;
  }
}
