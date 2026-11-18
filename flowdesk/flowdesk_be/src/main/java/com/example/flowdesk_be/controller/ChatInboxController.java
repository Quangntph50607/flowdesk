package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.service.ChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** API chat không gắn với 1 workspace cụ thể (badge trên menu). */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Tag(name = "Chat")
public class ChatInboxController {

  private final ChatService chatService;

  /** Tổng số tin chưa đọc của user (không tính conversation đã tắt thông báo). */
  @GetMapping("/unread-summary")
  public ResponseEntity<ApiResponse<Map<String, Object>>> unreadSummary(
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        Map.of("total", chatService.countUnreadTotal(ud.getUsername()))));
  }
}
