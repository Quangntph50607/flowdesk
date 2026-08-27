package com.example.flowdesk_be.entity;

import jakarta.persistence.*;
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
@Table(name = "workspaces")
public class Workspace {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", nullable = false)
  private Long id;

  @Nationalized
  @Column(name = "name", nullable = false, length = 150)
  private String name;

  // slug unique — dùng cho URL
  @Column(name = "slug", nullable = false, unique = true, length = 150)
  private String slug;

  // User tạo workspace (SUPER_ADMIN)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "owner_id", nullable = false)
  private User owner;

  // Workspace cha — NULL nếu đây là workspace cấp công ty (level=0)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "parent_id")
  private Workspace parent;

  // 0 = công ty (workspace cha), 1 = chi nhánh (workspace con)
  @Builder.Default
  @Column(name = "level", nullable = false)
  private Integer level = 0;

  @Builder.Default
  @Column(name = "is_active", nullable = false)
  private Boolean isActive = true;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Danh sách workspace con
  @Builder.Default
  @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
  private List<Workspace> children = new ArrayList<>();

  // Danh sách thành viên trong workspace
  @Builder.Default
  @OneToMany(mappedBy = "workspace", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  private List<WorkspaceMember> members = new ArrayList<>();

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
