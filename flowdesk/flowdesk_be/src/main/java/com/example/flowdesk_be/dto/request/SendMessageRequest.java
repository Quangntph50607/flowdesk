package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {

  /**
   * Loại tin nhắn: TEXT | IMAGE | FILE | VIDEO | AUDIO
   * Mặc định là TEXT nếu FE không truyền.
   */
  private String type = "TEXT";

  /**
   * Nội dung:
   * - type=TEXT → chuỗi văn bản
   * - type=IMAGE/FILE/VIDEO/AUDIO → URL trả về từ /api/upload/chat
   */
  @NotNull(message = "Nội dung không được null")
  private String content;

  /**
   * Tên file gốc (chỉ dùng khi type != TEXT, để hiển thị trên UI).
   * Ví dụ: "bao_cao.pdf", "anh_nhom.png"
   */
  private String fileName;

  /**
   * Kích thước file (bytes), chỉ dùng khi type != TEXT.
   */
  private Long fileSize;
}
