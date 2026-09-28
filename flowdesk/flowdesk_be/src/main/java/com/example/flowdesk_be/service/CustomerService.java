package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.CustomerRequest;
import com.example.flowdesk_be.dto.request.CustomerTagRequest;
import com.example.flowdesk_be.dto.response.CustomerActivityResponse;
import com.example.flowdesk_be.dto.response.CustomerResponse;
import com.example.flowdesk_be.dto.response.CustomerTagResponse;

import java.util.List;

public interface CustomerService {
  List<CustomerResponse> getAccessibleCustomers(String requesterEmail, Long workspaceId, Long branchId,
      String search, String status, Long tagId);

  List<CustomerResponse> getCustomers(Long workspaceId, String requesterEmail, String search,
      Long branchId, String status, Long tagId);

  CustomerResponse getCustomer(Long workspaceId, Long customerId, String requesterEmail);

  CustomerResponse createCustomer(Long workspaceId, CustomerRequest request, String requesterEmail);

  CustomerResponse updateCustomer(Long workspaceId, Long customerId, CustomerRequest request, String requesterEmail);

  List<CustomerTagResponse> getTags(Long workspaceId, String requesterEmail);

  CustomerTagResponse createTag(Long workspaceId, CustomerTagRequest request, String requesterEmail);

  CustomerTagResponse updateTag(Long workspaceId, Long tagId, CustomerTagRequest request, String requesterEmail);

  void deleteTag(Long workspaceId, Long tagId, String requesterEmail);

  List<CustomerActivityResponse> getActivities(Long workspaceId, Long customerId, String requesterEmail);
}
