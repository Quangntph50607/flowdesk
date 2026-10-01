package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.LoginRequest;
import com.example.flowdesk_be.dto.request.RefreshTokenRequest;
import com.example.flowdesk_be.dto.request.RegisterRequest;
import com.example.flowdesk_be.dto.response.AuthResponse;
import com.example.flowdesk_be.entity.RefreshToken;
import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.RefreshTokenRepository;
import com.example.flowdesk_be.repository.UserRepository;
import com.example.flowdesk_be.security.JwtUtil;
import com.example.flowdesk_be.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private static final Pattern PHONE_PATTERN = Pattern.compile("0\\d{9,10}");

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;

  @Value("${app.jwt.refresh-expiration-days}")
  private long refreshExpirationDays;

  @Override
  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
      throw AppException.conflict("Email đã được sử dụng");
    }

    String phone = blankToNull(request.getPhone());
    String phoneNormalized = normalizePhoneOrThrow(phone);
    if (phoneNormalized != null && userRepository.existsByPhoneNormalized(phoneNormalized)) {
      throw AppException.conflict("Số điện thoại đã được sử dụng");
    }

    User user = User.builder()
        .email(request.getEmail())
        .passwordHash(passwordEncoder.encode(request.getPassword()))
        .fullName(request.getFullName())
        .phone(phone)
        .phoneNormalized(phoneNormalized)
        .address(blankToNull(request.getAddress()))
        .dateOfBirth(request.getDateOfBirth())
        .isActive(true)
        .build();

    userRepository.save(user);

    return buildAuthResponse(user);
  }

  @Override
  @Transactional
  public AuthResponse login(LoginRequest request) {
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getEmail(),
            request.getPassword()));

    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

    return buildAuthResponse(user);
  }

  @Override
  @Transactional
  public AuthResponse refresh(RefreshTokenRequest request) {
    // Tìm refresh token trong DB
    RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
        .orElseThrow(() -> new RuntimeException("Refresh token không hợp lệ"));

    // Kiểm tra đã bị revoke chưa
    if (refreshToken.getIsRevoked()) {
      throw new RuntimeException("Refresh token đã bị thu hồi");
    }

    // Kiểm tra còn hạn không
    if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new RuntimeException("Refresh token đã hết hạn");
    }

    // Rotate: revoke token cũ, tạo token mới
    refreshToken.setIsRevoked(true);
    refreshTokenRepository.save(refreshToken);

    return buildAuthResponse(refreshToken.getUser());
  }

  @Override
  @Transactional
  public void logout(RefreshTokenRequest request) {
    RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
        .orElseThrow(() -> new RuntimeException("Refresh token không hợp lệ"));

    refreshToken.setIsRevoked(true);
    refreshTokenRepository.save(refreshToken);
  }

  @Override
  @Transactional
  public void logoutAll(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

    // Revoke toàn bộ refresh token của user này
    refreshTokenRepository.revokeAllByUser(user);
  }

  // Tạo access token + refresh token mới rồi đóng gói thành AuthResponse
  private AuthResponse buildAuthResponse(User user) {
    String accessToken = jwtUtil.generateAccessToken(user.getEmail());
    String rawRefreshToken = jwtUtil.generateRefreshToken();

    // Lưu refresh token vào DB
    RefreshToken refreshToken = RefreshToken.builder()
        .user(user)
        .token(rawRefreshToken)
        .expiresAt(LocalDateTime.now().plusDays(refreshExpirationDays))
        .isRevoked(false)
        .build();

    refreshTokenRepository.save(refreshToken);

    // Workspace memberships của user (active)
    List<AuthResponse.WorkspaceInfo> workspaces = user.getWorkspaceMemberships()
        .stream()
        .filter(m -> m.getIsActive())
        .map(m -> new AuthResponse.WorkspaceInfo(
            m.getWorkspace().getId(),
            m.getWorkspace().getName(),
            m.getWorkspace().getSlug(),
            m.getWorkspace().getParent() != null ? m.getWorkspace().getParent().getId() : null,
            m.getRole().getCode()))
        .toList();

    return new AuthResponse(
        accessToken,
        rawRefreshToken,
        "Bearer",
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        user.getAvatarUrl(),
        user.getPhone(),
        user.getAddress(),
        user.getDateOfBirth(),
        user.getSystemRole(),
        workspaces);
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
}
