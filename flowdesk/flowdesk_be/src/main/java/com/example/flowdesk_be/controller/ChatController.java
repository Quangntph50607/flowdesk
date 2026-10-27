package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.*;
import com.example.flowdesk_be.dto.response.*;
import com.example.flowdesk_be.service.ChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/chat")
@RequiredArgsConstructor
@Tag(name = "Chat")
public class ChatController {

  private final ChatService chatService;
  private final SimpMessagingTemplate messagingTemplate;

  @GetMapping("/rooms")
  public ResponseEntity<ApiResponse<PageResponse<RoomResponse>>> getMyRooms(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails ud,
      @RequestParam(defaultValue = "20") Integer limit,
      @RequestParam(defaultValue = "1") Integer page) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        PageResponse.fromList(chatService.getMyRooms(workspaceId, ud.getUsername()), limit, page)));
  }

  @GetMapping("/rooms/search")
  public ResponseEntity<ApiResponse<List<RoomResponse>>> searchRooms(
      @PathVariable Long workspaceId,
      @RequestParam String keyword,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.searchRooms(workspaceId, keyword, ud.getUsername())));
  }

  @PostMapping("/rooms/direct")
  public ResponseEntity<ApiResponse<RoomResponse>> openDirect(
      @PathVariable Long workspaceId,
      @Valid @RequestBody OpenDirectRequest req,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.openOrCreateDirect(workspaceId, req, ud.getUsername())));
  }

  @PostMapping("/rooms/group")
  public ResponseEntity<ApiResponse<RoomResponse>> createGroup(
      @PathVariable Long workspaceId,
      @Valid @RequestBody CreateGroupRequest req,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.status(201).body(ApiResponse.success(201, "Tạo nhóm thành công",
        chatService.createGroup(workspaceId, req, ud.getUsername())));
  }

  @GetMapping("/rooms/{roomId}/messages")
  public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "30") int size,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.getMessages(roomId, page, size, ud.getUsername())));
  }

  @GetMapping("/rooms/{roomId}/messages/search")
  public ResponseEntity<ApiResponse<Page<MessageResponse>>> searchMessages(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @RequestParam String keyword,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.searchMessages(roomId, keyword, page, size, ud.getUsername())));
  }

  @PostMapping("/rooms/{roomId}/read")
  public ResponseEntity<ApiResponse<Void>> markRead(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.markRead(roomId, ud.getUsername());
    // Broadcast read-receipt event cho các member trong room
    messagingTemplate.convertAndSend("/topic/room/" + roomId,
        (Object) Map.of("eventType", "READ_RECEIPT", "roomId", roomId,
            "receipts", chatService.getReadReceipts(roomId, ud.getUsername())));
    return ResponseEntity.ok(ApiResponse.success(200, "OK", null));
  }

  @GetMapping("/rooms/{roomId}/read-receipts")
  public ResponseEntity<ApiResponse<List<ReadReceiptResponse>>> getReadReceipts(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.getReadReceipts(roomId, ud.getUsername())));
  }

  @PatchMapping("/rooms/{roomId}/pin")
  public ResponseEntity<ApiResponse<RoomResponse>> togglePin(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.togglePin(roomId, ud.getUsername())));
  }

  @PatchMapping("/rooms/{roomId}/mute")
  public ResponseEntity<ApiResponse<RoomResponse>> toggleMute(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.toggleMute(roomId, ud.getUsername())));
  }

  @PatchMapping("/rooms/{roomId}/messages/{messageId}")
  public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @PathVariable Long messageId,
      @Valid @RequestBody UpdateMessageRequest req,
      @AuthenticationPrincipal UserDetails ud) {
    MessageResponse updated = chatService.editMessage(roomId, messageId, req.getContent(), ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId, updated);
    return ResponseEntity.ok(ApiResponse.success(200, "OK", updated));
  }

  @PatchMapping("/rooms/{roomId}/messages/{messageId}/recall")
  public ResponseEntity<ApiResponse<MessageResponse>> recallMessage(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @PathVariable Long messageId,
      @AuthenticationPrincipal UserDetails ud) {
    MessageResponse updated = chatService.recallMessage(roomId, messageId, ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId, updated);
    return ResponseEntity.ok(ApiResponse.success(200, "OK", updated));
  }

  @PostMapping("/rooms/{roomId}/members/{targetUserId}")
  public ResponseEntity<ApiResponse<Void>> addMember(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @PathVariable Long targetUserId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.addMember(roomId, targetUserId, ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId,
        (Object) Map.of("eventType", "MEMBER_ADDED", "roomId", roomId, "targetUserId", targetUserId));
    return ResponseEntity.ok(ApiResponse.success(200, "Thêm thành viên thành công", null));
  }

  @DeleteMapping("/rooms/{roomId}/members/{targetUserId}")
  public ResponseEntity<ApiResponse<Void>> removeMember(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @PathVariable Long targetUserId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.removeMember(roomId, targetUserId, ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId,
        (Object) Map.of("eventType", "MEMBER_REMOVED", "roomId", roomId, "targetUserId", targetUserId));
    return ResponseEntity.ok(ApiResponse.success(200, "Đã xóa thành viên", null));
  }

  @PostMapping("/rooms/{roomId}/leave")
  public ResponseEntity<ApiResponse<Void>> leave(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.leaveRoom(roomId, ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId,
        (Object) Map.of("eventType", "MEMBER_LEFT", "roomId", roomId));
    return ResponseEntity.ok(ApiResponse.success(200, "Đã rời nhóm", null));
  }

  @PatchMapping("/rooms/{roomId}/name")
  public ResponseEntity<ApiResponse<RoomResponse>> rename(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @RequestParam String name,
      @AuthenticationPrincipal UserDetails ud) {
    RoomResponse updated = chatService.renameGroup(roomId, name, ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId,
        (Object) Map.of("eventType", "ROOM_RENAMED", "roomId", roomId, "name", name));
    return ResponseEntity.ok(ApiResponse.success(200, "OK", updated));
  }

  @PatchMapping("/rooms/{roomId}/avatar")
  public ResponseEntity<ApiResponse<RoomResponse>> updateAvatar(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @RequestParam(required = false) String avatarUrl,
      @AuthenticationPrincipal UserDetails ud) {
    RoomResponse updated = chatService.updateGroupAvatar(roomId, avatarUrl, ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId,
        (Object) Map.of("eventType", "AVATAR_UPDATED", "roomId", roomId));
    return ResponseEntity.ok(ApiResponse.success(200, "OK", updated));
  }

  @GetMapping("/rooms/{roomId}/members")
  public ResponseEntity<ApiResponse<Map<String, Object>>> getRoomMembers(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.getRoomMembers(roomId, ud.getUsername())));
  }

  @DeleteMapping("/rooms/{roomId}")
  public ResponseEntity<ApiResponse<Void>> deleteRoom(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.deleteRoom(roomId, ud.getUsername());
    messagingTemplate.convertAndSend("/topic/room/" + roomId,
        (Object) Map.of("eventType", "ROOM_DELETED", "roomId", roomId));
    return ResponseEntity.ok(ApiResponse.success(200, "Đã xóa nhóm", null));
  }
}
