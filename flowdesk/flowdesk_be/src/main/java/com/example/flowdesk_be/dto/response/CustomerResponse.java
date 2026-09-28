package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.Customer;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class CustomerResponse {
  private Long id;
  private Long workspaceId;
  private Long branchId;
  private String branchName;
  private Long assignedUserId;
  private String assignedUserName;
  private Long createdBy;
  private String createdByName;
  private String name;
  private String phone;
  private String email;
  private String address;
  private String source;
  private String status;
  private String note;
  private List<CustomerTagResponse> tags;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static CustomerResponse from(Customer customer) {
    CustomerResponse r = new CustomerResponse();
    r.id = customer.getId();
    r.workspaceId = customer.getWorkspace().getId();
    r.branchId = customer.getBranch().getId();
    r.branchName = customer.getBranch().getName();
    if (customer.getAssignedUser() != null) {
      r.assignedUserId = customer.getAssignedUser().getId();
      r.assignedUserName = customer.getAssignedUser().getFullName();
    }
    r.createdBy = customer.getCreatedBy().getId();
    r.createdByName = customer.getCreatedBy().getFullName();
    r.name = customer.getName();
    r.phone = customer.getPhone();
    r.email = customer.getEmail();
    r.address = customer.getAddress();
    r.source = customer.getSource();
    r.status = customer.getStatus();
    r.note = customer.getNote();
    r.tags = customer.getTagAssignments().stream()
        .map(assignment -> CustomerTagResponse.from(assignment.getTag()))
        .toList();
    r.createdAt = customer.getCreatedAt();
    r.updatedAt = customer.getUpdatedAt();
    return r;
  }
}
