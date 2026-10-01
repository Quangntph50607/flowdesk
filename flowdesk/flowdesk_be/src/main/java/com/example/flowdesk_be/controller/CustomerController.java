package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.CustomerRequest;
import com.example.flowdesk_be.dto.request.CustomerTagRequest;
import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.dto.response.CustomerActivityResponse;
import com.example.flowdesk_be.dto.response.CustomerResponse;
import com.example.flowdesk_be.dto.response.CustomerTagResponse;
import com.example.flowdesk_be.dto.response.PageResponse;
import com.example.flowdesk_be.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Workspace - Customers")
public class CustomerController {

  private final CustomerService customerService;

  @Operation(summary = "Danh sách khách hàng tổng hợp theo quyền user")
  @GetMapping("/api/customers")
  public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> getAccessibleCustomers(
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestParam(required = false) Long workspaceId,
      @RequestParam(required = false) Long branchId,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Long tagId,
      @RequestParam(defaultValue = "10") Integer limit,
      @RequestParam(defaultValue = "1") Integer page) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        PageResponse.fromList(
            customerService.getAccessibleCustomers(userDetails.getUsername(), workspaceId, branchId, search, status,
                tagId),
            limit, page)));
  }

  @Operation(summary = "Danh sách khách hàng theo quyền workspace/chi nhánh")
  @GetMapping("/api/workspaces/{workspaceId}/customers")
  public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> getCustomers(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Long branchId,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Long tagId,
      @RequestParam(defaultValue = "10") Integer limit,
      @RequestParam(defaultValue = "1") Integer page) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        PageResponse.fromList(
            customerService.getCustomers(workspaceId, userDetails.getUsername(), search, branchId, status, tagId), limit,
            page)));
  }

  @Operation(summary = "Chi tiết khách hàng")
  @GetMapping("/api/workspaces/{workspaceId}/customers/{customerId}")
  public ResponseEntity<ApiResponse<CustomerResponse>> getCustomer(
      @PathVariable Long workspaceId,
      @PathVariable Long customerId,
      @AuthenticationPrincipal UserDetails userDetails) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        customerService.getCustomer(workspaceId, customerId, userDetails.getUsername())));
  }

  @Operation(summary = "Tạo khách hàng")
  @PostMapping("/api/workspaces/{workspaceId}/customers")
  public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CustomerRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(201, "Tạo khách hàng thành công",
        customerService.createCustomer(workspaceId, request, userDetails.getUsername())));
  }

  @Operation(summary = "Cập nhật khách hàng")
  @PutMapping("/api/workspaces/{workspaceId}/customers/{customerId}")
  public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
      @PathVariable Long workspaceId,
      @PathVariable Long customerId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CustomerRequest request) {
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật khách hàng thành công",
        customerService.updateCustomer(workspaceId, customerId, request, userDetails.getUsername())));
  }

  @Operation(summary = "Danh sách tag khách hàng")
  @GetMapping("/api/workspaces/{workspaceId}/customer-tags")
  public ResponseEntity<ApiResponse<PageResponse<CustomerTagResponse>>> getTags(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestParam(defaultValue = "20") Integer limit,
      @RequestParam(defaultValue = "1") Integer page) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        PageResponse.fromList(customerService.getTags(workspaceId, userDetails.getUsername()), limit, page)));
  }

  @Operation(summary = "Tạo tag khách hàng")
  @PostMapping("/api/workspaces/{workspaceId}/customer-tags")
  public ResponseEntity<ApiResponse<CustomerTagResponse>> createTag(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CustomerTagRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(201, "Tạo tag thành công",
        customerService.createTag(workspaceId, request, userDetails.getUsername())));
  }

  @Operation(summary = "Cập nhật tag khách hàng")
  @PutMapping("/api/workspaces/{workspaceId}/customer-tags/{tagId}")
  public ResponseEntity<ApiResponse<CustomerTagResponse>> updateTag(
      @PathVariable Long workspaceId,
      @PathVariable Long tagId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CustomerTagRequest request) {
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật tag thành công",
        customerService.updateTag(workspaceId, tagId, request, userDetails.getUsername())));
  }

  @Operation(summary = "Xóa tag khách hàng")
  @DeleteMapping("/api/workspaces/{workspaceId}/customer-tags/{tagId}")
  public ResponseEntity<ApiResponse<Void>> deleteTag(
      @PathVariable Long workspaceId,
      @PathVariable Long tagId,
      @AuthenticationPrincipal UserDetails userDetails) {
    customerService.deleteTag(workspaceId, tagId, userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Xóa tag thành công", null));
  }

  @Operation(summary = "Lịch sử khách hàng")
  @GetMapping("/api/workspaces/{workspaceId}/customers/{customerId}/activities")
  public ResponseEntity<ApiResponse<PageResponse<CustomerActivityResponse>>> getActivities(
      @PathVariable Long workspaceId,
      @PathVariable Long customerId,
      @AuthenticationPrincipal UserDetails userDetails,
      @RequestParam(defaultValue = "10") Integer limit,
      @RequestParam(defaultValue = "1") Integer page) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        PageResponse.fromList(customerService.getActivities(workspaceId, customerId, userDetails.getUsername()), limit,
            page)));
  }
}
