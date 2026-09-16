package com.example.flowdesk_be.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UploadResponse {
  /** URL đầy đủ của file trên Backblaze B2 */
  private String fileUrl;
  /** Tên file gốc */
  private String fileName;
  /** MIME type (image/png, application/pdf, ...) */
  private String fileType;
  /** Kích thước file (bytes) */
  private Long fileSize;
}
