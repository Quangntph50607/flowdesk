package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

  List<ChatRoomMember> findByRoomIdAndIsActiveTrue(Long roomId);

  Optional<ChatRoomMember> findByRoomIdAndUserId(Long roomId, Long userId);

  boolean existsByRoomIdAndUserIdAndIsActiveTrue(Long roomId, Long userId);

  @Query("""
      SELECT m FROM ChatRoomMember m
      JOIN FETCH m.room r
      JOIN FETCH r.workspace
      WHERE m.user.id = :userId
        AND r.workspace.id = :workspaceId
        AND m.isActive = true
        AND r.isActive = true
      ORDER BY m.isPinned DESC, r.updatedAt DESC
      """)
  List<ChatRoomMember> findMyRoomsInWorkspace(
      @Param("userId") Long userId,
      @Param("workspaceId") Long workspaceId);

  /**
   * Search conversation trong sidebar:
   * - GROUP: so khớp tên nhóm (r.name)
   * - DIRECT: so khớp tên của người kia (user khác trong room đó)
   *
   * Cách tiếp cận: với DIRECT, join thêm member khác để lọc theo fullName.
   * Dùng 2 query riêng rồi merge ở service, hoặc dùng UNION-style JPQL.
   * Vì JPQL không hỗ trợ UNION, ta dùng 1 query lọc GROUP + 1 query lọc DIRECT.
   */
  @Query("""
      SELECT m FROM ChatRoomMember m
      JOIN FETCH m.room r
      JOIN FETCH r.workspace
      WHERE m.user.id = :userId
        AND r.workspace.id = :workspaceId
        AND m.isActive = true
        AND r.isActive = true
        AND r.type = 'GROUP'
        AND LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
      ORDER BY m.isPinned DESC, r.updatedAt DESC
      """)
  List<ChatRoomMember> searchGroupRooms(
      @Param("userId") Long userId,
      @Param("workspaceId") Long workspaceId,
      @Param("keyword") String keyword);

  @Query("""
      SELECT m FROM ChatRoomMember m
      JOIN FETCH m.room r
      JOIN FETCH r.workspace
      WHERE m.user.id = :userId
        AND r.workspace.id = :workspaceId
        AND m.isActive = true
        AND r.isActive = true
        AND r.type = 'DIRECT'
        AND EXISTS (
            SELECT m2 FROM ChatRoomMember m2
            WHERE m2.room = r
              AND m2.user.id <> :userId
              AND m2.isActive = true
              AND LOWER(m2.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
        )
      ORDER BY m.isPinned DESC, r.updatedAt DESC
      """)
  List<ChatRoomMember> searchDirectRooms(
      @Param("userId") Long userId,
      @Param("workspaceId") Long workspaceId,
      @Param("keyword") String keyword);
}
