package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.CreateGroupRequest;
import com.example.flowdesk_be.dto.request.OpenDirectRequest;
import com.example.flowdesk_be.dto.response.GroupMemberResponse;
import com.example.flowdesk_be.dto.response.MessageResponse;
import com.example.flowdesk_be.dto.response.RoomResponse;
import com.example.flowdesk_be.entity.*;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.*;
import com.example.flowdesk_be.service.ChatService;
import com.example.flowdesk_be.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

  private static final Pattern URL_PATTERN = Pattern.compile("https?://\\S+");

  private final ChatRoomRepository roomRepo;
  private final ChatRoomMemberRepository memberRepo;
  private final ChatMessageRepository messageRepo;
  private final UserRepository userRepo;
  private final WorkspaceMemberRepository workspaceMemberRepo;
  private final WorkspaceRepository workspaceRepo;
  private final StorageService storageService;

  // ── Helpers ──────────────────────────────────────────────────────

  private User findUser(String email) {
    return userRepo.findByEmail(email)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));
  }

  private User findUserById(Long id) {
    return userRepo.findById(id)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user id: " + id));
  }

  private Workspace findWorkspace(Long id) {
    return workspaceRepo.findById(id)
        .filter(Workspace::getIsActive)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy workspace"));
  }

  // Kiểm tra user còn active trong room
  private ChatRoomMember assertActiveMember(Long roomId, Long userId) {
    return memberRepo.findByRoomIdAndUserId(roomId, userId)
        .filter(ChatRoomMember::getIsActive)
        .orElseThrow(() -> AppException.forbidden("Bạn không thuộc conversation này"));
  }

  // Kiểm tra user là thành viên active của workspace (workspace isolation)
  // Hỗ trợ cả workspace cha lẫn workspace con (level=1)
  private void assertInWorkspace(Long workspaceId, Long userId) {
    // Lấy workspace để xác định level
    Workspace workspace = workspaceRepo.findById(workspaceId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy workspace"));

    // Tập hợp các workspaceId cần check (bản thân + các con nếu là workspace cha)
    List<Long> idsToCheck;
    if (workspace.getLevel() == 0) {
      // Workspace cha: check cả cha lẫn tất cả con
      List<Long> childIds = workspace.getChildren().stream()
          .map(Workspace::getId)
          .toList();
      idsToCheck = new java.util.ArrayList<>();
      idsToCheck.add(workspaceId);
      idsToCheck.addAll(childIds);
    } else {
      // Workspace con: chỉ check chính nó
      idsToCheck = List.of(workspaceId);
    }

    boolean isMember = workspaceMemberRepo
        .findAllByWorkspaceIdIn(idsToCheck)
        .stream()
        .anyMatch(m -> m.getUser().getId().equals(userId) && Boolean.TRUE.equals(m.getIsActive()));

    if (!isMember) {
      throw AppException.forbidden("User không thuộc workspace này");
    }
  }

  // Build RoomResponse cho 1 membership (tính unread bên trong)
  private RoomResponse buildRoomResponse(ChatRoomMember membership, Long currentUserId) {
    ChatRoom room = membership.getRoom();

    // Tên hiển thị: nếu DIRECT thì lấy tên người kia
    String name = room.getName();
    String avatarInitial = "?";
    if ("DIRECT".equals(room.getType())) {
      ChatRoomMember other = memberRepo.findByRoomIdAndIsActiveTrue(room.getId())
          .stream()
          .filter(m -> !m.getUser().getId().equals(currentUserId))
          .findFirst()
          .orElse(null);
      if (other != null) {
        name = other.getUser().getFullName();
        avatarInitial = name != null && !name.isEmpty()
            ? String.valueOf(name.charAt(0)).toUpperCase()
            : "?";
      }
    } else if (name != null && !name.isEmpty()) {
      avatarInitial = String.valueOf(name.charAt(0)).toUpperCase();
    }

    // Last message
    Page<ChatMessage> lastPage = messageRepo.findByRoomIdWithSender(
        room.getId(), PageRequest.of(0, 1));
    ChatMessage last = lastPage.isEmpty() ? null : lastPage.getContent().get(0);

    // Unread
    long unread = messageRepo.countUnread(
        room.getId(), currentUserId, membership.getLastReadAt());

    return RoomResponse.builder()
        .id(room.getId())
        .type(room.getType())
        .name(name)
        .avatarInitial(avatarInitial)
        .lastMessage(last == null ? null
            : (last.getIsRecalled() ? "Tin nhắn đã được thu hồi" : last.getContent()))
        .lastMessageAt(last == null ? room.getCreatedAt() : last.getCreatedAt())
        .unreadCount((int) unread)
        .isOwner(Boolean.TRUE.equals(membership.getIsOwner()))
        .build();
  }

  // ── API Methods ──────────────────────────────────────────────────

  @Override
  public List<RoomResponse> getMyRooms(Long workspaceId, String email) {
    User me = findUser(email);
    Workspace ws = findWorkspace(workspaceId);

    // Nếu là workspace con, lấy rooms từ workspace cha (rooms được tạo ở level
    // tổng)
    Long effectiveWorkspaceId = (ws.getLevel() != 0 && ws.getParent() != null)
        ? ws.getParent().getId()
        : workspaceId;

    List<ChatRoomMember> memberships = memberRepo.findMyRoomsInWorkspace(me.getId(), effectiveWorkspaceId);
    return memberships.stream()
        .map(m -> buildRoomResponse(m, me.getId()))
        .toList();
  }

  @Override
  @Transactional
  public RoomResponse openOrCreateDirect(Long workspaceId, OpenDirectRequest req, String email) {
    User me = findUser(email);
    User target = findUserById(req.getTargetUserId());
    Workspace ws = findWorkspace(workspaceId);

    // Resolve về workspace cha nếu là workspace con
    Long effectiveWorkspaceId = (ws.getLevel() != 0 && ws.getParent() != null)
        ? ws.getParent().getId()
        : workspaceId;
    Workspace effectiveWorkspace = (effectiveWorkspaceId.equals(workspaceId)) ? ws
        : findWorkspace(effectiveWorkspaceId);

    if (me.getId().equals(target.getId())) {
      throw AppException.badRequest("Không thể chat với chính mình");
    }
    // Workspace isolation: cả 2 phải thuộc workspace tổng hoặc chi nhánh của nó
    assertInWorkspace(effectiveWorkspaceId, me.getId());
    assertInWorkspace(effectiveWorkspaceId, target.getId());

    // Tìm room DIRECT đã có
    return roomRepo.findDirectRoom(effectiveWorkspaceId, me.getId(), target.getId())
        .map(existing -> {
          ChatRoomMember myMembership = memberRepo.findByRoomIdAndUserId(existing.getId(), me.getId())
              .orElseThrow();
          return buildRoomResponse(myMembership, me.getId());
        })
        .orElseGet(() -> {
          // Tạo room mới
          ChatRoom room = ChatRoom.builder()
              .workspace(effectiveWorkspace)
              .type("DIRECT")
              .createdBy(me)
              .build();
          room = roomRepo.save(room);

          memberRepo.save(ChatRoomMember.builder().room(room).user(me).build());
          memberRepo.save(ChatRoomMember.builder().room(room).user(target).build());

          ChatRoomMember myMembership = memberRepo.findByRoomIdAndUserId(room.getId(), me.getId()).orElseThrow();
          return buildRoomResponse(myMembership, me.getId());
        });
  }

  @Override
  @Transactional
  public RoomResponse createGroup(Long workspaceId, CreateGroupRequest req, String email) {
    User me = findUser(email);
    Workspace ws = findWorkspace(workspaceId);

    // Resolve về workspace cha nếu là workspace con
    Long effectiveWorkspaceId = (ws.getLevel() != 0 && ws.getParent() != null)
        ? ws.getParent().getId()
        : workspaceId;
    Workspace effectiveWorkspace = effectiveWorkspaceId.equals(workspaceId) ? ws : findWorkspace(effectiveWorkspaceId);

    assertInWorkspace(effectiveWorkspaceId, me.getId());

    ChatRoom room = ChatRoom.builder()
        .workspace(effectiveWorkspace)
        .type("GROUP")
        .name(req.getName())
        .createdBy(me)
        .build();
    room = roomRepo.save(room);

    // Thêm người tạo làm owner
    memberRepo.save(ChatRoomMember.builder()
        .room(room).user(me).isOwner(true).build());

    // Thêm các member được chọn
    final Long roomId = room.getId();
    for (Long memberId : req.getMemberIds()) {
      if (memberId.equals(me.getId()))
        continue; // skip chính mình
      User member = findUserById(memberId);
      assertInWorkspace(effectiveWorkspaceId, memberId); // isolation
      memberRepo.save(ChatRoomMember.builder()
          .room(ChatRoom.builder().id(roomId).build())
          .user(member).build());
    }

    // System message
    saveSystemMessage(room, me.getFullName() + " đã tạo nhóm.");

    ChatRoomMember myMembership = memberRepo.findByRoomIdAndUserId(room.getId(), me.getId()).orElseThrow();
    return buildRoomResponse(myMembership, me.getId());
  }

  @Override
  public Page<MessageResponse> getMessages(Long roomId, int page, int size, String email) {
    User me = findUser(email);
    assertActiveMember(roomId, me.getId());

    Pageable pageable = PageRequest.of(page, size);
    Page<ChatMessage> msgPage = messageRepo.findByRoomIdWithSender(roomId, pageable);
    return msgPage.map(MessageResponse::from);
  }

  @Override
  @Transactional
  public MessageResponse sendMessage(Long roomId, String content, String type,
      String fileName, Long fileSize, String email) {
    User me = findUser(email);
    ChatRoomMember membership = assertActiveMember(roomId, me.getId());
    ChatRoom room = membership.getRoom();

    // Normalize type – chỉ chấp nhận các giá trị hợp lệ
    String msgType = normalizeMessageType(type);

    ChatMessage msg = ChatMessage.builder()
        .room(room)
        .sender(me)
        .type(msgType)
        .content(content)
        .fileName(fileName)
        .fileSize(fileSize)
        .build();
    msg = messageRepo.save(msg);

    // Cập nhật updatedAt của room để sort đúng
    room.setUpdatedAt(LocalDateTime.now());
    roomRepo.save(room);

    return MessageResponse.from(msg);
  }

  private String normalizeMessageType(String type) {
    if (type == null)
      return "TEXT";
    return switch (type.toUpperCase()) {
      case "IMAGE" -> "IMAGE";
      case "FILE" -> "FILE";
      case "VIDEO" -> "VIDEO";
      case "AUDIO" -> "AUDIO";
      case "SYSTEM" -> "SYSTEM";
      default -> "TEXT";
    };
  }

  @Override
  @Transactional
  public void markRead(Long roomId, String email) {
    User me = findUser(email);
    ChatRoomMember membership = assertActiveMember(roomId, me.getId());
    membership.setLastReadAt(LocalDateTime.now());
    memberRepo.save(membership);
  }

  @Override
  @Transactional
  public void addMember(Long roomId, Long targetUserId, String email) {
    User me = findUser(email);
    ChatRoomMember myMembership = assertActiveMember(roomId, me.getId());
    if (!Boolean.TRUE.equals(myMembership.getIsOwner())) {
      throw AppException.forbidden("Chỉ trưởng nhóm được thêm thành viên");
    }
    ChatRoom room = myMembership.getRoom();
    assertInWorkspace(room.getWorkspace().getId(), targetUserId);

    if (memberRepo.existsByRoomIdAndUserIdAndIsActiveTrue(roomId, targetUserId)) {
      throw AppException.conflict("User đã là thành viên của nhóm");
    }

    User target = findUserById(targetUserId);
    // Nếu đã từng là member (isActive=false) thì reactivate
    memberRepo.findByRoomIdAndUserId(roomId, targetUserId).ifPresentOrElse(
        m -> {
          m.setIsActive(true);
          memberRepo.save(m);
        },
        () -> memberRepo.save(ChatRoomMember.builder().room(room).user(target).build()));

    saveSystemMessage(room, me.getFullName() + " đã thêm " + target.getFullName() + " vào nhóm.");
  }

  @Override
  @Transactional
  public void removeMember(Long roomId, Long targetUserId, String email) {
    User me = findUser(email);
    ChatRoomMember myMembership = assertActiveMember(roomId, me.getId());
    if (!Boolean.TRUE.equals(myMembership.getIsOwner())) {
      throw AppException.forbidden("Chỉ trưởng nhóm được xóa thành viên");
    }
    if (me.getId().equals(targetUserId)) {
      throw AppException.badRequest("Trưởng nhóm không thể tự xóa mình");
    }
    ChatRoomMember target = assertActiveMember(roomId, targetUserId);
    target.setIsActive(false);
    memberRepo.save(target);

    User targetUser = target.getUser();
    saveSystemMessage(myMembership.getRoom(),
        me.getFullName() + " đã xóa " + targetUser.getFullName() + " khỏi nhóm.");
  }

  @Override
  @Transactional
  public void leaveRoom(Long roomId, String email) {
    User me = findUser(email);
    ChatRoomMember membership = assertActiveMember(roomId, me.getId());
    if (Boolean.TRUE.equals(membership.getIsOwner())) {
      throw AppException.badRequest("Trưởng nhóm không thể rời nhóm");
    }
    membership.setIsActive(false);
    memberRepo.save(membership);
    saveSystemMessage(membership.getRoom(), me.getFullName() + " đã rời nhóm.");
  }

  @Override
  @Transactional
  public RoomResponse renameGroup(Long roomId, String newName, String email) {
    User me = findUser(email);
    ChatRoomMember membership = assertActiveMember(roomId, me.getId());
    if (!Boolean.TRUE.equals(membership.getIsOwner())) {
      throw AppException.forbidden("Chỉ trưởng nhóm được đổi tên nhóm");
    }
    ChatRoom room = membership.getRoom();
    room.setName(newName);
    roomRepo.save(room);
    saveSystemMessage(room, me.getFullName() + " đã đổi tên nhóm thành " + newName + ".");
    return buildRoomResponse(membership, me.getId());
  }

  @Override
  public Map<String, Object> getRoomMembers(Long roomId, String email) {
    User me = findUser(email);
    assertActiveMember(roomId, me.getId());
    List<GroupMemberResponse> members = memberRepo.findByRoomIdAndIsActiveTrue(roomId)
        .stream()
        .map(GroupMemberResponse::from)
        .toList();

    List<Map<String, Object>> media = new ArrayList<>();
    List<Map<String, Object>> docs = new ArrayList<>();
    List<Map<String, Object>> links = new ArrayList<>();

    for (ChatMessage message : messageRepo.findSharedContentByRoomId(roomId)) {
      String type = message.getType();
      if ("IMAGE".equals(type) || "VIDEO".equals(type)) {
        media.add(buildSharedFilePayload(message));
      } else if ("FILE".equals(type)) {
        docs.add(buildSharedFilePayload(message));
      } else if ("TEXT".equals(type) && message.getContent() != null) {
        Matcher matcher = URL_PATTERN.matcher(message.getContent());
        while (matcher.find()) {
          String url = matcher.group();
          links.add(Map.of(
              "messageId", message.getId(),
              "url", url,
              "createdAt", message.getCreatedAt()));
        }
      }
    }

    return Map.of(
        "total", members.size(),
        "members", members,
        "media", media,
        "links", links,
        "docs", docs);
  }

  private Map<String, Object> buildSharedFilePayload(ChatMessage message) {
    MessageResponse response = MessageResponse.from(message);
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("id", response.getId());
    payload.put("roomId", response.getRoomId());
    payload.put("senderId", response.getSenderId());
    payload.put("senderName", response.getSenderName());
    payload.put("senderAvatarInitial", response.getSenderAvatarInitial());
    payload.put("type", response.getType());
    payload.put("content", resolveSharedFileUrl(response.getContent()));
    payload.put("isRecalled", response.getIsRecalled());
    payload.put("isEdited", response.getIsEdited());
    payload.put("fileName", response.getFileName());
    payload.put("fileSize", response.getFileSize());
    payload.put("createdAt", response.getCreatedAt());
    return payload;
  }

  private String resolveSharedFileUrl(String rawUrl) {
    if (rawUrl == null || !rawUrl.contains("backblazeb2.com") || rawUrl.contains("X-Amz-Signature")
        || rawUrl.contains("x-amz-signature")) {
      return rawUrl;
    }
    String fileKey = extractB2FileKey(rawUrl);
    if (fileKey == null || fileKey.isBlank()) {
      return rawUrl;
    }
    try {
      return storageService.generatePresignedUrl(fileKey);
    } catch (Exception ignored) {
      return rawUrl;
    }
  }

  private String extractB2FileKey(String rawUrl) {
    try {
      java.net.URI uri = java.net.URI.create(rawUrl);
      String path = uri.getPath();
      if (path == null || path.isBlank()) {
        return null;
      }
      String[] parts = path.startsWith("/") ? path.substring(1).split("/", 2) : path.split("/", 2);
      return parts.length == 2 ? parts[1] : null;
    } catch (Exception ignored) {
      return null;
    }
  }

  @Override
  @Transactional
  public void deleteRoom(Long roomId, String email) {
    User me = findUser(email);
    ChatRoomMember membership = assertActiveMember(roomId, me.getId());
    if (!Boolean.TRUE.equals(membership.getIsOwner())) {
      throw AppException.forbidden("Chỉ trưởng nhóm được xóa nhóm");
    }
    ChatRoom room = membership.getRoom();
    if (!"GROUP".equals(room.getType())) {
      throw AppException.badRequest("Chỉ có thể xóa GROUP");
    }
    room.setIsActive(false);
    roomRepo.save(room);
  }

  // ── Private Utils ────────────────────────────────────────────────

  private void saveSystemMessage(ChatRoom room, String text) {
    // sender_id = createdBy của room (người tạo đại diện cho system)
    messageRepo.save(ChatMessage.builder()
        .room(room)
        .sender(room.getCreatedBy())
        .type("SYSTEM")
        .content(text)
        .build());
  }
}
