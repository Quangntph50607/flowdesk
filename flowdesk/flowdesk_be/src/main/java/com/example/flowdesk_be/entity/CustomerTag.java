package com.example.flowdesk_be.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "customer_tags", uniqueConstraints = @UniqueConstraint(name = "UQ_customer_tags_workspace_name", columnNames = {
    "workspace_id", "name" }))
public class CustomerTag {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id", nullable = false)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "workspace_id", nullable = false)
  private Workspace workspace;

  @Nationalized
  @Column(name = "name", nullable = false, length = 80)
  private String name;

  @Column(name = "color", nullable = false, length = 20)
  private String color;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

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
