package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

  boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);

  Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);

  // Lấy tất cả members active của một workspace
  List<WorkspaceMember> findAllByWorkspaceIdAndIsActiveTrue(Long workspaceId);

  // Lấy tất cả workspace memberships active của một user
  List<WorkspaceMember> findAllByUserIdAndIsActiveTrue(Long userId);
}
