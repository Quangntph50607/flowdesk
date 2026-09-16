package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.SendMessageRequest;
import com.example.flowdesk_be.dto.response.MessageResponse;
import com.example.flowdesk_be.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

  private final ChatService chatService;
  private final SimpMessagingTemplate messagingTemplate;

  /**
   * Gửi tin nhắn văn bản hoặc file qua WebSocket.
   *
   * FE gửi JSON tới /app/chat/{roomId}/send:
   * {
   * "type": "TEXT" | "IMAGE" | "FILE" | "VIDEO" | "AUDIO",
   * "content": "nội dung text hoặc URL file",
   * "fileName": "ten_file.pdf", // chỉ khi type != TEXT
   * "fileSize": 204800 // chỉ khi type != TEXT
   * }
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
        principal.getName());

    messagingTemplate.convertAndSend("/topic/room/" + roomId, saved);
  }
}
