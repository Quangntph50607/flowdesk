package com.example.flowdesk_be.service;

import com.example.flowdesk_be.exception.AppException;
import java.security.Principal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Trạng thái online/offline của user.
 *
 * Sự kiện chỉ được phát khi trạng thái thay đổi, và chỉ tới
 * /topic/workspace/{rootWorkspaceId}/presence của các workspace user thuộc về
 * (không lộ thông tin sang workspace khác).
 * Client lấy trạng thái ban đầu qua {@link #getPresenceSnapshot}.
 */
@Service
public class ChatPresenceService {
  private static final long HEARTBEAT_TIMEOUT_MS = 45_000;
  private final SimpMessagingTemplate messagingTemplate;
  private final ChatAccessGuard accessGuard;
  private final Map<String, Map<String, Long>> sessions = new ConcurrentHashMap<>();
  /** Thời điểm offline gần nhất (in-memory, mất khi restart server). */
  private final Map<String, Instant> lastSeen = new ConcurrentHashMap<>();

  public ChatPresenceService(SimpMessagingTemplate messagingTemplate, ChatAccessGuard accessGuard) {
    this.messagingTemplate = messagingTemplate;
    this.accessGuard = accessGuard;
  }

  @EventListener
  public void connected(SessionConnectedEvent event) {
    StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
    // event.getUser() lấy từ session — header của CONNECT_ACK có thể không chứa user
    Principal user = event.getUser() != null ? event.getUser() : accessor.getUser();
    String sessionId = accessor.getSessionId();
    if (user == null || sessionId == null) return;
    touch(user.getName(), sessionId);
  }

  @EventListener
  public void disconnected(SessionDisconnectEvent event) {
    StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
    Principal user = event.getUser() != null ? event.getUser() : accessor.getUser();
    String sessionId = event.getSessionId();
    if (user == null || sessionId == null) return;
    Map<String, Long> userSessions = sessions.get(user.getName());
    if (userSessions != null) {
      userSessions.remove(sessionId);
      if (userSessions.isEmpty() && sessions.remove(user.getName(), userSessions)) broadcast(user.getName(), false);
    }
  }

  public void heartbeat(Principal principal, String sessionId) {
    if (principal == null || sessionId == null) return;
    // Session có thể đã bị expire do mất heartbeat tạm thời → đăng ký lại
    touch(principal.getName(), sessionId);
  }

  @Scheduled(fixedDelay = 15_000)
  public void expireStaleSessions() {
    long cutoff = System.currentTimeMillis() - HEARTBEAT_TIMEOUT_MS;
    sessions.forEach((email, userSessions) -> {
      userSessions.entrySet().removeIf(entry -> entry.getValue() < cutoff);
      if (userSessions.isEmpty() && sessions.remove(email, userSessions)) broadcast(email, false);
    });
  }

  /** Danh sách email đang online trong workspace (gồm cả chi nhánh). */
  public Map<String, Object> getPresenceSnapshot(Long workspaceId, String requesterEmail) {
    Long rootId = accessGuard.resolveRootWorkspaceId(workspaceId);
    Set<String> members = accessGuard.memberEmailsOfRoot(rootId);
    if (!members.contains(requesterEmail)) {
      throw AppException.forbidden("User không thuộc workspace này");
    }
    List<String> online = members.stream().filter(sessions::containsKey).toList();
    Map<String, String> seen = new LinkedHashMap<>();
    members.stream()
        .filter(email -> !sessions.containsKey(email) && lastSeen.containsKey(email))
        .forEach(email -> seen.put(email, lastSeen.get(email).toString()));
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("rootWorkspaceId", rootId);
    result.put("onlineEmails", online);
    result.put("lastSeen", seen);
    return result;
  }

  private void touch(String email, String sessionId) {
    Map<String, Long> userSessions = sessions.computeIfAbsent(email, k -> new ConcurrentHashMap<>());
    boolean wasOffline = userSessions.isEmpty();
    userSessions.put(sessionId, System.currentTimeMillis());
    if (wasOffline) broadcast(email, true);
  }

  private void broadcast(String email, boolean online) {
    if (online) lastSeen.remove(email);
    else lastSeen.put(email, Instant.now());
    Map<String, Object> payload = Map.of(
        "eventType", "PRESENCE", "email", email, "online", online, "at", Instant.now().toString());
    for (Long rootId : accessGuard.rootWorkspaceIdsOf(email)) {
      messagingTemplate.convertAndSend("/topic/workspace/" + rootId + "/presence", (Object) payload);
    }
  }
}
