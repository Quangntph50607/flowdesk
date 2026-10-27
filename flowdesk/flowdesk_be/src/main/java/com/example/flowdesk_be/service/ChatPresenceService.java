package com.example.flowdesk_be.service;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Service
public class ChatPresenceService {
  private static final long HEARTBEAT_TIMEOUT_MS = 45_000;
  private final SimpMessagingTemplate messagingTemplate;
  private final Map<String, Map<String, Long>> sessions = new ConcurrentHashMap<>();

  public ChatPresenceService(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  @EventListener
  public void connected(SessionConnectedEvent event) {
    StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
    Principal user = accessor.getUser();
    String sessionId = accessor.getSessionId();
    if (user == null || sessionId == null) return;
    Map<String, Long> userSessions = sessions.computeIfAbsent(user.getName(), k -> new ConcurrentHashMap<>());
    boolean wasOffline = userSessions.isEmpty();
    userSessions.put(sessionId, System.currentTimeMillis());
    if (wasOffline) broadcast(user.getName(), true);
  }

  @EventListener
  public void disconnected(SessionDisconnectEvent event) {
    StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
    Principal user = accessor.getUser();
    String sessionId = accessor.getSessionId();
    if (user == null || sessionId == null) return;
    Map<String, Long> userSessions = sessions.get(user.getName());
    if (userSessions != null) {
      userSessions.remove(sessionId);
      if (userSessions.isEmpty() && sessions.remove(user.getName(), userSessions)) broadcast(user.getName(), false);
    }
  }

  public void heartbeat(Principal principal, String sessionId) {
    if (principal == null || sessionId == null) return;
    Map<String, Long> userSessions = sessions.get(principal.getName());
    if (userSessions != null && userSessions.containsKey(sessionId)) {
      userSessions.put(sessionId, System.currentTimeMillis());
      broadcast(principal.getName(), true);
    }
  }

  @Scheduled(fixedDelay = 15_000)
  public void expireStaleSessions() {
    long cutoff = System.currentTimeMillis() - HEARTBEAT_TIMEOUT_MS;
    sessions.forEach((email, userSessions) -> {
      userSessions.entrySet().removeIf(entry -> entry.getValue() < cutoff);
      if (userSessions.isEmpty() && sessions.remove(email, userSessions)) broadcast(email, false);
    });
  }

  private void broadcast(String email, boolean online) {
    messagingTemplate.convertAndSend("/topic/presence", (Object) Map.of(
        "eventType", "PRESENCE", "email", email, "online", online, "at", Instant.now().toString()));
  }
}
