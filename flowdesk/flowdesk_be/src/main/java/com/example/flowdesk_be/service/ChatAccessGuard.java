package com.example.flowdesk_be.service;

import com.example.flowdesk_be.entity.Workspace;
import com.example.flowdesk_be.entity.WorkspaceMember;
import com.example.flowdesk_be.repository.ChatRoomMemberRepository;
import com.example.flowdesk_be.repository.UserRepository;
import com.example.flowdesk_be.repository.WorkspaceMemberRepository;
import com.example.flowdesk_be.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Kiểm tra quyền truy cập cho các kênh realtime của chat nội bộ.
 *
 * Chỉ cho phép SUBSCRIBE:
 * - /topic/room/{roomId} → user là member active của room đang hoạt động.
 * - /topic/workspace/{rootId}/presence → user thuộc workspace tổng (hoặc chi nhánh của nó).
 * - /user/queue/** → kênh riêng của chính user (Spring tự định tuyến theo principal).
 */
@Component
@RequiredArgsConstructor
public class ChatAccessGuard {

  private static final Pattern ROOM_TOPIC = Pattern.compile("^/topic/room/(\\d+)$");
  private static final Pattern PRESENCE_TOPIC = Pattern.compile("^/topic/workspace/(\\d+)/presence$");

  private final ChatRoomMemberRepository roomMemberRepo;
  private final WorkspaceRepository workspaceRepo;
  private final WorkspaceMemberRepository workspaceMemberRepo;
  private final UserRepository userRepo;

  @Transactional(readOnly = true)
  public boolean canSubscribe(String email, String destination) {
    if (email == null || destination == null) {
      return false;
    }
    if (destination.startsWith("/user/queue/")) {
      return true;
    }
    Matcher room = ROOM_TOPIC.matcher(destination);
    if (room.matches()) {
      return roomMemberRepo.isActiveMemberByEmail(Long.parseLong(room.group(1)), email);
    }
    Matcher presence = PRESENCE_TOPIC.matcher(destination);
    if (presence.matches()) {
      Long rootId = Long.parseLong(presence.group(1));
      return rootId.equals(resolveRootWorkspaceId(rootId)) && memberEmailsOfRoot(rootId).contains(email);
    }
    return false;
  }

  /** Workspace con → id workspace cha; workspace tổng → chính nó. */
  @Transactional(readOnly = true)
  public Long resolveRootWorkspaceId(Long workspaceId) {
    return workspaceRepo.findById(workspaceId)
        .map(this::rootOf)
        .orElse(null);
  }

  /** Email của tất cả member active thuộc workspace tổng và các chi nhánh của nó. */
  @Transactional(readOnly = true)
  public Set<String> memberEmailsOfRoot(Long rootWorkspaceId) {
    if (rootWorkspaceId == null) {
      return Set.of();
    }
    Workspace root = workspaceRepo.findById(rootWorkspaceId).orElse(null);
    if (root == null) {
      return Set.of();
    }
    List<Long> ids = new ArrayList<>();
    ids.add(root.getId());
    root.getChildren().forEach(child -> ids.add(child.getId()));
    return workspaceMemberRepo.findAllByWorkspaceIdIn(ids).stream()
        .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
        .map(m -> m.getUser().getEmail())
        .collect(Collectors.toSet());
  }

  /** Các workspace tổng mà user đang thuộc về (trực tiếp hoặc qua chi nhánh). */
  @Transactional(readOnly = true)
  public Set<Long> rootWorkspaceIdsOf(String email) {
    return userRepo.findByEmail(email)
        .map(user -> workspaceMemberRepo.findAllByUserIdAndIsActiveTrue(user.getId()).stream()
            .map(WorkspaceMember::getWorkspace)
            .map(this::rootOf)
            .collect(Collectors.toCollection(LinkedHashSet::new)))
        .orElseGet(LinkedHashSet::new);
  }

  private Long rootOf(Workspace ws) {
    return (ws.getLevel() != null && ws.getLevel() != 0 && ws.getParent() != null)
        ? ws.getParent().getId()
        : ws.getId();
  }
}
