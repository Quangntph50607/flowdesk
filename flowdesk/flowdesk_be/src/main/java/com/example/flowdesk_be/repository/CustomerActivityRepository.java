package com.example.flowdesk_be.repository;

import com.example.flowdesk_be.entity.CustomerActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerActivityRepository extends JpaRepository<CustomerActivity, Long> {
  List<CustomerActivity> findAllByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
