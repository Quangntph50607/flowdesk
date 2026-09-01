package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.request.AddMemberRequest;
import com.example.flowdesk_be.dto.request.CreateWorkspaceRequest;
import com.example.flowdesk_be.dto.request.UpdateWorkspaceRequest;
import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.dto.response.MemberResponse;
import com.example.flowdesk_be.dto.response.WorkspaceResponse;
import com.example.flowdesk_be.service.MemberService;
import com.example.flowdesk_be.service.WorkspaceService;
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
public class WorkspaceController {

  private final WorkspaceService workspaceService;
  private final MemberService memberService;

  // ================================================================
  // SUPER_ADMIN — Workspace tổng /api/admin/workspaces
  // ================================================================

  @Tag(name = "Admin – Workspaces")
  @Operation(summary = "Tạo workspace tổng mới")
  @PostMapping("/api/admin/workspaces")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateWorkspaceRequest request) {

    WorkspaceResponse data = workspaceService.createWorkspace(
        userDetails.getUsername(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Tạo workspace thành công", data));
  }

  @Tag(name = "Admin – Workspaces")
  @Operation(summary = "Danh sách tất cả workspace tổng (kèm chi nhánh)")
  @GetMapping("/api/admin/workspaces")
  public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getAllWorkspaces(
      @RequestParam(required = false) String search) {
    return ResponseEntity.ok(
        ApiResponse.success(200, "OK", workspaceService.getAllWorkspaces(search)));
  }

  @Tag(name = "Admin – Workspaces")
  @Operation(summary = "Chi tiết workspace tổng (kèm chi nhánh)")
  @GetMapping("/api/admin/workspaces/{id}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspace(
      @PathVariable Long id) {
    return ResponseEntity.ok(
        ApiResponse.success(200, "OK", workspaceService.getWorkspaceById(id)));
  }

  @Tag(name = "Admin – Workspaces")
  @Operation(summary = "Cập nhật workspace tổng")
  @PutMapping("/api/admin/workspaces/{id}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
      @PathVariable Long id,
      @Valid @RequestBody UpdateWorkspaceRequest request) {

    return ResponseEntity.ok(
        ApiResponse.success(200, "Cập nhật thành công",
            workspaceService.updateWorkspace(id, request)));
  }

  @Tag(name = "Admin – Workspaces")
  @Operation(summary = "Xoá workspace tổng (soft delete)")
  @DeleteMapping("/api/admin/workspaces/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteWorkspace(@PathVariable Long id) {
    workspaceService.deleteWorkspace(id);
    return ResponseEntity.ok(ApiResponse.success(200, "Xoá workspace thành công", null));
  }

  // ================================================================
  // OWNER + ADMIN — Chi nhánh /api/workspaces/{id}/branches
  // ================================================================

  @Tag(name = "Workspace – Branches")
  @Operation(summary = "Lấy workspace (dành cho member — OWNER/ADMIN/AGENT)")
  @GetMapping("/api/workspaces/{workspaceId}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceForMember(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails) {

    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        workspaceService.getWorkspaceForMember(workspaceId, userDetails.getUsername())));
  }

  @Tag(name = "Workspace – Branches")
  @Operation(summary = "Tạo chi nhánh")
  @PostMapping("/api/workspaces/{workspaceId}/branches")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> createBranch(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateWorkspaceRequest request) {

    WorkspaceResponse data = workspaceService.createBranch(
        workspaceId, userDetails.getUsername(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Tạo chi nhánh thành công", data));
  }

  @Tag(name = "Workspace – Branches")
  @Operation(summary = "Danh sách chi nhánh của workspace tổng")
  @GetMapping("/api/workspaces/{workspaceId}/branches")
  public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getBranches(
      @PathVariable Long workspaceId) {

    return ResponseEntity.ok(
        ApiResponse.success(200, "OK", workspaceService.getBranches(workspaceId)));
  }

  @Tag(name = "Workspace – Branches")
  @Operation(summary = "Cập nhật chi nhánh")
  @PutMapping("/api/workspaces/{workspaceId}/branches/{branchId}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> updateBranch(
      @PathVariable Long workspaceId,
      @PathVariable Long branchId,
      @Valid @RequestBody UpdateWorkspaceRequest request) {

    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật chi nhánh thành công",
        workspaceService.updateBranch(workspaceId, branchId, request)));
  }

  @Tag(name = "Workspace – Branches")
  @Operation(summary = "Xoá chi nhánh (soft delete)")
  @DeleteMapping("/api/workspaces/{workspaceId}/branches/{branchId}")
  public ResponseEntity<ApiResponse<Void>> deleteBranch(
      @PathVariable Long workspaceId,
      @PathVariable Long branchId) {

    workspaceService.deleteBranch(workspaceId, branchId);
    return ResponseEntity.ok(ApiResponse.success(200, "Xoá chi nhánh thành công", null));
  }

  // ================================================================
  // OWNER + ADMIN — Members /api/workspaces/{id}/members
  // ================================================================

  @Tag(name = "Workspace – Members")
  @Operation(summary = "Thêm thành viên vào workspace/chi nhánh")
  @PostMapping("/api/workspaces/{workspaceId}/members")
  public ResponseEntity<ApiResponse<MemberResponse>> addMember(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody AddMemberRequest request) {

    MemberResponse data = memberService.addMember(
        workspaceId, request, userDetails.getUsername());
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Thêm thành viên thành công", data));
  }

  @Tag(name = "Workspace – Members")
  @Operation(summary = "Danh sách thành viên của workspace/chi nhánh")
  @GetMapping("/api/workspaces/{workspaceId}/members")
  public ResponseEntity<ApiResponse<List<MemberResponse>>> getMembers(
      @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails) {

    return ResponseEntity.ok(ApiResponse.success(200, "OK",
        memberService.getMembers(workspaceId, userDetails.getUsername())));
  }

  @Tag(name = "Workspace – Members")
  @Operation(summary = "Bật/tắt trạng thái thành viên")
  @PatchMapping("/api/workspaces/{workspaceId}/members/{memberId}/toggle-active")
  public ResponseEntity<ApiResponse<MemberResponse>> toggleMemberActive(
      @PathVariable Long workspaceId,
      @PathVariable Long memberId,
      @AuthenticationPrincipal UserDetails userDetails) {

    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật trạng thái thành công",
        memberService.toggleMemberActive(workspaceId, memberId, userDetails.getUsername())));
  }

  @Tag(name = "Workspace – Members")
  @Operation(summary = "Xoá thành viên khỏi workspace/chi nhánh")
  @DeleteMapping("/api/workspaces/{workspaceId}/members/{memberId}")
  public ResponseEntity<ApiResponse<Void>> removeMember(
      @PathVariable Long workspaceId,
      @PathVariable Long memberId,
      @AuthenticationPrincipal UserDetails userDetails) {

    memberService.removeMember(workspaceId, memberId, userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Xoá thành viên thành công", null));
  }
}
