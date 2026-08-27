package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

  // Kiểm tra user đã là member của workspace chưa
  boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);

  // Tìm membership cụ thể
  Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);

  // Lấy tất cả workspace mà 1 user tham gia
  List<WorkspaceMember> findAllByUserIdAndIsActiveTrue(Long userId);

  // Lấy tất cả member của 1 workspace
  List<WorkspaceMember> findAllByWorkspaceIdAndIsActiveTrue(Long workspaceId);

  // Lấy tất cả member theo role trong 1 workspace
  @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.role.code = :roleCode AND wm.isActive = true")
  List<WorkspaceMember> findAllByWorkspaceIdAndRoleCode(Long workspaceId, String roleCode);
}
