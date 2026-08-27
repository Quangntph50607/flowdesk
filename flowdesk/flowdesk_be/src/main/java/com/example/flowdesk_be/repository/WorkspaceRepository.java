package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

  Optional<Workspace> findBySlug(String slug);

  boolean existsBySlug(String slug);

  // Lấy tất cả workspace cha (level=0)
  List<Workspace> findAllByLevelAndIsActiveTrue(Integer level);

  // Lấy workspace con theo parent
  List<Workspace> findAllByParentIdAndIsActiveTrue(Long parentId);
}
