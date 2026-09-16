package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("""
        SELECT r FROM ChatRoom r
        WHERE r.workspace.id = :workspaceId
          AND r.type = 'DIRECT'
          AND r.isActive = true
          AND EXISTS (
              SELECT m FROM ChatRoomMember m
              WHERE m.room = r AND m.user.id = :userA AND m.isActive = true
          )
          AND EXISTS (
              SELECT m FROM ChatRoomMember m
              WHERE m.room = r AND m.user.id = :userB AND m.isActive = true
          )
        """)
    Optional<ChatRoom> findDirectRoom(
            @Param("workspaceId") Long workspaceId,
            @Param("userA") Long userA,
            @Param("userB") Long userB);
}
