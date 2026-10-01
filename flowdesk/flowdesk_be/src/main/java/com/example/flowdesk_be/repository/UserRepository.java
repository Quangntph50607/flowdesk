package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  boolean existsByPhoneNormalized(String phoneNormalized);

  boolean existsByPhoneNormalizedAndIdNot(String phoneNormalized, Long id);

  Page<User> findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(String email, String fullName, Pageable pageable);

  // User chưa là member của workspace chỉ định (dùng cho add-member dialog)
  @org.springframework.data.jpa.repository.Query("""
      select u from User u
      where u.systemRole is null
        and u.isActive = true
        and u.id not in (
          select m.user.id from WorkspaceMember m where m.workspace.id = :workspaceId
        )
        and (:search is null or :search = ''
          or lower(u.email) like lower(concat('%', :search, '%'))
          or lower(u.fullName) like lower(concat('%', :search, '%')))
      order by u.fullName
      """)
  Page<User> findAvailableForWorkspace(
      @org.springframework.data.repository.query.Param("workspaceId") Long workspaceId,
      @org.springframework.data.repository.query.Param("search") String search,
      Pageable pageable);
}
