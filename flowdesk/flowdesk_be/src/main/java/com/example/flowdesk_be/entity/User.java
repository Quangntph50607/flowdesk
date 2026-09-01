package com.example.flowdesk_be.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", nullable = false)
  private Long id;

  @Size(max = 255)
  @NotNull
  @Nationalized
  @Column(name = "email", nullable = false)
  private String email;

  @Size(max = 255)
  @NotNull
  @Nationalized
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Size(max = 150)
  @NotNull
  @Nationalized
  @Column(name = "full_name", nullable = false, length = 150)
  private String fullName;

  @Size(max = 500)
  @Nationalized
  @Column(name = "avatar_url", length = 500)
  private String avatarUrl;

  // 'SUPER_ADMIN' hoặc NULL
  @Size(max = 50)
  @Column(name = "system_role", length = 50)
  private String systemRole;

  @Builder.Default
  @NotNull
  @Column(name = "is_active", nullable = false)
  private Boolean isActive = true;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Builder.Default
  @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  private List<WorkspaceMember> workspaceMemberships = new ArrayList<>();

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public boolean isSuperAdmin() {
    return "SUPER_ADMIN".equals(systemRole);
  }
}
