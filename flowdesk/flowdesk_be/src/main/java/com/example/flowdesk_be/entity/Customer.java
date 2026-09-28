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
@Table(name = "customers")
public class Customer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", nullable = false)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "branch_id", nullable = false)
  private Workspace branch;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_user_id")
  private User assignedUser;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by", nullable = false)
  private User createdBy;

  @Nationalized
  @Column(name = "name", nullable = false, length = 150)
  private String name;

  @Nationalized
  @Column(name = "phone", length = 40)
  private String phone;

  @Nationalized
  @Column(name = "email", length = 255)
  private String email;

  @Nationalized
  @Column(name = "address", length = 500)
  private String address;

  @Nationalized
  @Column(name = "source", length = 80)
  private String source;

  @Builder.Default
  @Nationalized
  @Column(name = "status", nullable = false, length = 50)
  private String status = "NEW";

  @Nationalized
  @Column(name = "note", length = 1000)
  private String note;

  @Builder.Default
  @Column(name = "is_active", nullable = false)
  private Boolean isActive = true;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Builder.Default
  @OneToMany(mappedBy = "customer", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
  private List<CustomerTagAssignment> tagAssignments = new ArrayList<>();

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
