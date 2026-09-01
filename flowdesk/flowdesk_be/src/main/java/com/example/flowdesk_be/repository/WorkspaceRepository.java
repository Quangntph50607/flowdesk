package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

  boolean existsBySlug(String slug);

  Optional<Workspace> findBySlug(String slug);

  List<Workspace> findAllByLevelAndIsActiveTrue(Integer level);

  List<Workspace> findAllByParentIdAndIsActiveTrue(Long parentId);

  List<Workspace> findByLevelAndIsActiveTrueAndNameContainingIgnoreCase(Integer level, String name);
}
