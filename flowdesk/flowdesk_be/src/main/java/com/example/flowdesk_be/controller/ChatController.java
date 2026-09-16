package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.*;
import com.example.flowdesk_be.dto.response.*;
import com.example.flowdesk_be.service.ChatService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
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

  @GetMapping("/rooms")
  public ResponseEntity<ApiResponse<List<RoomResponse>>> getMyRooms(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.getMyRooms(workspaceId, ud.getUsername())));
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

  @PostMapping("/rooms/{roomId}/read")
  public ResponseEntity<ApiResponse<Void>> markRead(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.markRead(roomId, ud.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "OK", null));
  }

  @PostMapping("/rooms/{roomId}/members/{targetUserId}")
  public ResponseEntity<ApiResponse<Void>> addMember(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @PathVariable Long targetUserId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.addMember(roomId, targetUserId, ud.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Thêm thành viên thành công", null));
  }

  @DeleteMapping("/rooms/{roomId}/members/{targetUserId}")
  public ResponseEntity<ApiResponse<Void>> removeMember(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @PathVariable Long targetUserId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.removeMember(roomId, targetUserId, ud.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Đã xóa thành viên", null));
  }

  @PostMapping("/rooms/{roomId}/leave")
  public ResponseEntity<ApiResponse<Void>> leave(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @AuthenticationPrincipal UserDetails ud) {
    chatService.leaveRoom(roomId, ud.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Đã rời nhóm", null));
  }

  @PatchMapping("/rooms/{roomId}/name")
  public ResponseEntity<ApiResponse<RoomResponse>> rename(
      @PathVariable Long workspaceId,
      @PathVariable Long roomId,
      @RequestParam String name,
      @AuthenticationPrincipal UserDetails ud) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        chatService.renameGroup(roomId, name, ud.getUsername())));
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
    return ResponseEntity.ok(ApiResponse.success(200, "Đã xóa nhóm", null));
  }
}
