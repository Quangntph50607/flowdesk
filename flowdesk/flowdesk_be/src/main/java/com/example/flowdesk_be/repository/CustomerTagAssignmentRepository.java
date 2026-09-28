package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.CustomerTagAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerTagAssignmentRepository extends JpaRepository<CustomerTagAssignment, Long> {
  void deleteAllByCustomerId(Long customerId);

  void deleteAllByTagId(Long tagId);
}
