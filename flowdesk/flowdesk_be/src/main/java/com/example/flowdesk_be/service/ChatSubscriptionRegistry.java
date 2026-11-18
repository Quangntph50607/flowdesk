package com.example.flowdesk_be.service;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Theo dõi các subscription đang mở để server có thể chủ động cắt
 * (ví dụ khi user bị xóa khỏi nhóm / rời nhóm / nhóm bị xóa),
 * đảm bảo user đó không còn nhận message realtime của room.
 */
@Component
public class ChatSubscriptionRegistry {

  private record Sub(String sessionId, String subscriptionId, String email, String destination) {
  }

  /** sessionId → (subscriptionId → Sub) */
  private final Map<String, Map<String, Sub>> bySession = new ConcurrentHashMap<>();

  @EventListener
  public void onSubscribe(SessionSubscribeEvent event) {
    StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
    Principal user = acc.getUser();
    if (user == null || acc.getSessionId() == null || acc.getSubscriptionId() == null
        || acc.getDestination() == null) {
      return;
    }
    bySession.computeIfAbsent(acc.getSessionId(), k -> new ConcurrentHashMap<>())
        .put(acc.getSubscriptionId(),
            new Sub(acc.getSessionId(), acc.getSubscriptionId(), user.getName(), acc.getDestination()));
  }

  @EventListener
  public void onUnsubscribe(SessionUnsubscribeEvent event) {
    StompHeaderAccessor acc = StompHeaderAccessor.wrap(event.getMessage());
    Map<String, Sub> subs = acc.getSessionId() == null ? null : bySession.get(acc.getSessionId());
    if (subs != null && acc.getSubscriptionId() != null) {
      subs.remove(acc.getSubscriptionId());
    }
  }

  @EventListener
  public void onDisconnect(SessionDisconnectEvent event) {
    bySession.remove(event.getSessionId());
  }

  /**
   * Hủy subscription tới destination.
   *
   * @param email null = hủy cho tất cả user
   */
  public void forceUnsubscribe(String destination, String email, MessageChannel brokerChannel) {
    bySession.values().forEach(subs -> subs.values().removeIf(sub -> {
      if (!sub.destination().equals(destination) || (email != null && !email.equals(sub.email()))) {
        return false;
      }
      SimpMessageHeaderAccessor acc = SimpMessageHeaderAccessor.create(SimpMessageType.UNSUBSCRIBE);
      acc.setSessionId(sub.sessionId());
      acc.setSubscriptionId(sub.subscriptionId());
      acc.setLeaveMutable(true);
      brokerChannel.send(MessageBuilder.createMessage(new byte[0], acc.getMessageHeaders()));
      return true;
    }));
  }
}
