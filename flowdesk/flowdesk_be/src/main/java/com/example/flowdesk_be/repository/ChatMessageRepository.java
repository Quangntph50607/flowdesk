package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

  @Query("""
      SELECT m FROM ChatMessage m
      JOIN FETCH m.sender
      WHERE m.room.id = :roomId
      ORDER BY m.createdAt DESC
      """)
  Page<ChatMessage> findByRoomIdWithSender(
      @Param("roomId") Long roomId,
      Pageable pageable);

  @Query("""
      SELECT m FROM ChatMessage m
      JOIN FETCH m.sender
      WHERE m.room.id = :roomId
        AND m.isRecalled = false
        AND (
          m.type IN ('IMAGE', 'VIDEO', 'FILE')
          OR (m.type = 'TEXT' AND m.content LIKE '%http%')
        )
      ORDER BY m.createdAt DESC
      """)
  List<ChatMessage> findSharedContentByRoomId(@Param("roomId") Long roomId);

  @Query("""
      SELECT COUNT(m) FROM ChatMessage m
      WHERE m.room.id = :roomId
        AND m.sender.id <> :userId
        AND (:lastReadAt IS NULL OR m.createdAt > :lastReadAt)
      """)
  long countUnread(
      @Param("roomId") Long roomId,
      @Param("userId") Long userId,
      @Param("lastReadAt") java.time.LocalDateTime lastReadAt);

  /**
   * Tìm kiếm tin nhắn theo từ khóa trong một conversation.
   * - Chỉ tìm trong tin TEXT chưa bị recall.
   * - Trả về phân trang, sort theo createdAt DESC (mới nhất trên cùng).
   */
  @Query("""
      SELECT m FROM ChatMessage m
      JOIN FETCH m.sender
      WHERE m.room.id = :roomId
        AND m.type = 'TEXT'
        AND m.isRecalled = false
        AND LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
      ORDER BY m.createdAt DESC
      """)
  Page<ChatMessage> searchMessages(
      @Param("roomId") Long roomId,
      @Param("keyword") String keyword,
      Pageable pageable);
}
