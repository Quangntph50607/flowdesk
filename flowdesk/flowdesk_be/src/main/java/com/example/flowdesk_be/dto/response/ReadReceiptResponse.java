package com.example.flowdesk_be.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

/**
 * Thông tin "ai đã xem" trong một room.
 * lastReadAt: thời điểm user đọc lần cuối — dùng để xác định họ đã đọc đến
 * message nào.
 */
@Getter
@Builder
public class ReadReceiptResponse {
  private Long userId;
  private String fullName;
  private String avatarInitial;
  private String avatarUrl;
  private LocalDateTime lastReadAt;
}
