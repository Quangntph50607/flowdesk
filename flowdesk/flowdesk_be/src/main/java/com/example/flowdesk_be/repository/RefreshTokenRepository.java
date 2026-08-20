package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.RefreshToken;
import com.example.flowdesk_be.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  // Tìm token theo chuỗi token — dùng khi /refresh
  Optional<RefreshToken> findByToken(String token);

  // Revoke tất cả token của 1 user — dùng khi logout-all hoặc đổi password
  @Modifying
  @Query("UPDATE RefreshToken r SET r.isRevoked = true WHERE r.user = :user AND r.isRevoked = false")
  void revokeAllByUser(User user);
}
