package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

  boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);

  Optional<WorkspaceMember> findByWorkspaceIdAndUserId(Long workspaceId, Long userId);

  // Lấy tất cả members active của một workspace
  List<WorkspaceMember> findAllByWorkspaceIdAndIsActiveTrue(Long workspaceId);

  // Lấy TẤT CẢ members (kể cả inactive) của một workspace
  List<WorkspaceMember> findAllByWorkspaceId(Long workspaceId);

  @Query("""
      select member from WorkspaceMember member
      where member.workspace.id = :workspaceId
        and (lower(member.user.email) like lower(concat('%', :search, '%'))
          or lower(member.user.fullName) like lower(concat('%', :search, '%')))
      """)
  List<WorkspaceMember> searchByWorkspaceId(
      @Param("workspaceId") Long workspaceId,
      @Param("search") String search);

  // Lấy tất cả workspace memberships active của một user
  List<WorkspaceMember> findAllByUserIdAndIsActiveTrue(Long userId);

  // Lấy tất cả members của nhiều workspace cùng lúc (dùng cho all-members
  // endpoint)
  @Query("""
      select m from WorkspaceMember m
        join fetch m.user
        join fetch m.role
        join fetch m.workspace w
        left join fetch w.parent
      where w.id in :workspaceIds
      order by m.workspace.level asc, m.user.fullName asc
      """)
  List<WorkspaceMember> findAllByWorkspaceIdIn(@Param("workspaceIds") List<Long> workspaceIds);
}
