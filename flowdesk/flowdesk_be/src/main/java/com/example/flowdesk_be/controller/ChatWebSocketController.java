package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.SendMessageRequest;
import com.example.flowdesk_be.dto.response.MessageResponse;
import com.example.flowdesk_be.service.ChatService;
import com.example.flowdesk_be.service.ChatPresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

  private final ChatService chatService;
  private final SimpMessagingTemplate messagingTemplate;
  private final ChatPresenceService presenceService;

  /**
   * Gửi tin nhắn qua WebSocket.
   */
  @MessageMapping("/chat/{roomId}/send")
  public void sendMessage(
      @DestinationVariable Long roomId,
      @Payload SendMessageRequest req,
      Principal principal) {

    MessageResponse saved = chatService.sendMessage(
        roomId,
        req.getContent(),
        req.getType(),
        req.getFileName(),
        req.getFileSize(),
        req.getReplyToMessageId(),
        principal.getName());

    messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
  }

  /**
   * Typing indicator — FE gửi khi user đang nhập.
   *
   * FE publish tới /app/chat/{roomId}/typing:
   * { "typing": true | false }
   *
   * BE broadcast tới /topic/room/{roomId}:
   * { "eventType": "TYPING", "userId": ..., "userName": "...", "typing":
   * true/false }
   */
  @MessageMapping("/chat/{roomId}/typing")
  public void typing(
      @DestinationVariable Long roomId,
      @Payload Map<String, Object> payload,
      Principal principal) {

    boolean isTyping = Boolean.TRUE.equals(payload.get("typing"));
    String email = principal.getName();

    // Lấy tên user để hiển thị "X đang nhập..."
    // Dùng email làm fallback nếu chưa load được fullName
    String displayName = (String) payload.getOrDefault("userName", email);

    messagingTemplate.convertAndSend("/topic/room/" + roomId, (Object) Map.of(
        "eventType", "TYPING",
        "roomId", roomId,
        "userEmail", email,
        "userName", displayName,
        "typing", isTyping));
  }

  @MessageMapping("/presence/heartbeat")
  public void heartbeat(Principal principal,
      @org.springframework.messaging.handler.annotation.Header("simpSessionId") String sessionId) {
    presenceService.heartbeat(principal, sessionId);
  }
}
