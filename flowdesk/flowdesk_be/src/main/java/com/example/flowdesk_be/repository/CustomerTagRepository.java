package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.CustomerTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CustomerTagRepository extends JpaRepository<CustomerTag, Long> {
  List<CustomerTag> findAllByWorkspaceIdOrderByNameAsc(Long workspaceId);

  List<CustomerTag> findAllByWorkspaceIdAndIdIn(Long workspaceId, Collection<Long> ids);

  Optional<CustomerTag> findByWorkspaceIdAndNameIgnoreCase(Long workspaceId, String name);
}
