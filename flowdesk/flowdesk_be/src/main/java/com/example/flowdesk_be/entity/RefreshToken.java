package com.example.flowdesk_be.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", nullable = false)
  private Long id;

  // Nhiều refresh token thuộc về 1 user
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  // Chuỗi UUID random lưu DB, dùng để tra cứu
  @Column(name = "token", nullable = false, unique = true, length = 500)
  private String token;

  // Thời điểm hết hạn — check khi /refresh
  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

  // false = còn dùng được, true = đã bị thu hồi
  @Column(name = "is_revoked", nullable = false)
  private Boolean isRevoked = false;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }
}
