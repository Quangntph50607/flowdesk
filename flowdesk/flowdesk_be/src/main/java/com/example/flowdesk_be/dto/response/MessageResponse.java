package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.ChatMessage;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class MessageResponse {
  private Long id;
  private Long roomId;
  private Long senderId;
  private String senderName;
  private String senderAvatarInitial;
  private String type;
  private String content;
  private Boolean isRecalled;
  private Boolean isEdited;
  /** Tên file gốc (khi type = IMAGE / FILE / VIDEO / AUDIO) */
  private String fileName;
  /** Kích thước file (bytes) */
  private Long fileSize;
  private LocalDateTime createdAt;

  public static MessageResponse from(ChatMessage msg) {
    return MessageResponse.builder()
        .id(msg.getId())
        .roomId(msg.getRoom().getId())
        .senderId(msg.getSender().getId())
        .senderName(msg.getSender().getFullName())
        .senderAvatarInitial(
            msg.getSender().getFullName() != null
                ? String.valueOf(msg.getSender().getFullName().charAt(0)).toUpperCase()
                : "?")
        .type(msg.getType())
        .content(msg.getIsRecalled() ? null : msg.getContent())
        .isRecalled(msg.getIsRecalled())
        .isEdited(msg.getIsEdited())
        .fileName(msg.getIsRecalled() ? null : msg.getFileName())
        .fileSize(msg.getIsRecalled() ? null : msg.getFileSize())
        .createdAt(msg.getCreatedAt())
        .build();
  }
}
