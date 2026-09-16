package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.CreateGroupRequest;
import com.example.flowdesk_be.dto.request.OpenDirectRequest;
import com.example.flowdesk_be.dto.response.MessageResponse;
import com.example.flowdesk_be.dto.response.RoomResponse;
import org.springframework.data.domain.Page;
import java.util.List;
import java.util.Map;

public interface ChatService {
  List<RoomResponse> getMyRooms(Long workspaceId, String email);

  RoomResponse openOrCreateDirect(Long workspaceId, OpenDirectRequest req, String email);

  RoomResponse createGroup(Long workspaceId, CreateGroupRequest req, String email);

  Page<MessageResponse> getMessages(Long roomId, int page, int size, String email);

  MessageResponse sendMessage(Long roomId, String content, String type,
      String fileName, Long fileSize, String email);

  void markRead(Long roomId, String email);

  void addMember(Long roomId, Long targetUserId, String email);

  void removeMember(Long roomId, Long targetUserId, String email);

  void leaveRoom(Long roomId, String email);

  RoomResponse renameGroup(Long roomId, String newName, String email);

  Map<String, Object> getRoomMembers(Long roomId, String email);

  void deleteRoom(Long roomId, String email);
}
