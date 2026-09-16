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
@Table(name = "chat_messages")
public class ChatMessage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "room_id", nullable = false)
  private ChatRoom room;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "sender_id", nullable = false)
  private User sender;

  @Builder.Default
  @Column(nullable = false, length = 20)
  private String type = "TEXT";

  @Nationalized
  @Column(columnDefinition = "NVARCHAR(MAX)")
  private String content;

  /** Tên file gốc (dùng khi type = IMAGE / FILE / VIDEO / AUDIO) */
  @Column(length = 500)
  private String fileName;

  /** Kích thước file tính bằng bytes */
  private Long fileSize;

  @Builder.Default
  @Column
  private Boolean isRecalled = false;
  @Builder.Default
  @Column
  private Boolean isEdited = false;

  @Column(updatable = false)
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }
}
