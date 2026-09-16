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
        ORDER BY r.updatedAt DESC
        """)
    List<ChatRoomMember> findMyRoomsInWorkspace(
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId);
}
