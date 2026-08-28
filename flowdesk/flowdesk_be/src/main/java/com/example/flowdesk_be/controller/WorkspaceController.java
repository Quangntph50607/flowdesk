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
import io.swagger.v3.oas.annotations.Parameter;
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
  // SUPER_ADMIN — Workspace cha (/api/admin/workspaces)
  // ================================================================

  @Tag(name = "Admin - Workspaces", description = "Quản lý workspace cấp công ty — chỉ SUPER_ADMIN")
  @Operation(summary = "Tạo workspace mới (cấp công ty)")
  @PostMapping("/api/admin/workspaces")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateWorkspaceRequest request) {

    WorkspaceResponse data = workspaceService.createWorkspace(
        userDetails.getUsername(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Tạo workspace thành công", data));
  }

  @Tag(name = "Admin - Workspaces")
  @Operation(summary = "Lấy danh sách tất cả workspace cấp công ty")
  @GetMapping("/api/admin/workspaces")
  public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getAllWorkspaces() {
    return ResponseEntity.ok(ApiResponse.success(200, "OK", workspaceService.getAllWorkspaces()));
  }

  @Tag(name = "Admin - Workspaces")
  @Operation(summary = "Lấy chi tiết workspace (kèm danh sách chi nhánh)")
  @GetMapping("/api/admin/workspaces/{id}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspace(
      @Parameter(description = "ID workspace cha") @PathVariable Long id) {
    return ResponseEntity.ok(ApiResponse.success(200, "OK", workspaceService.getWorkspaceById(id)));
  }

  @Tag(name = "Admin - Workspaces")
  @Operation(summary = "Cập nhật tên workspace")
  @PutMapping("/api/admin/workspaces/{id}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> updateWorkspace(
      @Parameter(description = "ID workspace cha") @PathVariable Long id,
      @Valid @RequestBody UpdateWorkspaceRequest request) {

    WorkspaceResponse data = workspaceService.updateWorkspace(id, request);
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật thành công", data));
  }

  @Tag(name = "Admin - Workspaces")
  @Operation(summary = "Xoá workspace (soft delete)", description = "Đánh dấu is_active = false cho workspace và toàn bộ chi nhánh con")
  @DeleteMapping("/api/admin/workspaces/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteWorkspace(
      @Parameter(description = "ID workspace cha") @PathVariable Long id) {
    workspaceService.deleteWorkspace(id);
    return ResponseEntity.ok(ApiResponse.success(200, "Xoá workspace thành công", null));
  }

  // ================================================================
  // SUPER_ADMIN + ADMIN — Branch (/api/workspace/{id}/branches)
  // ================================================================

  @Tag(name = "Workspace - Branches", description = "Quản lý chi nhánh — SUPER_ADMIN và ADMIN")
  @Operation(summary = "Lấy chi tiết workspace (kèm chi nhánh) — dành cho ADMIN")
  @GetMapping("/api/workspace/{workspaceId}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspaceForMember(
      @Parameter(description = "ID workspace") @PathVariable Long workspaceId) {
    return ResponseEntity.ok(
        ApiResponse.success(200, "OK", workspaceService.getWorkspaceById(workspaceId)));
  }

  @Tag(name = "Workspace - Branches", description = "Quản lý chi nhánh — SUPER_ADMIN và ADMIN")
  @Operation(summary = "Tạo chi nhánh mới trong workspace")
  @PostMapping("/api/workspace/{workspaceId}/branches")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> createBranch(
      @Parameter(description = "ID workspace cha") @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody CreateWorkspaceRequest request) {

    WorkspaceResponse data = workspaceService.createBranch(
        workspaceId, userDetails.getUsername(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Tạo chi nhánh thành công", data));
  }

  @Tag(name = "Workspace - Branches")
  @Operation(summary = "Lấy danh sách chi nhánh của workspace")
  @GetMapping("/api/workspace/{workspaceId}/branches")
  public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getBranches(
      @Parameter(description = "ID workspace cha") @PathVariable Long workspaceId) {

    return ResponseEntity.ok(
        ApiResponse.success(200, "OK", workspaceService.getBranches(workspaceId)));
  }

  @Tag(name = "Workspace - Branches")
  @Operation(summary = "Cập nhật tên chi nhánh")
  @PutMapping("/api/workspace/{workspaceId}/branches/{branchId}")
  public ResponseEntity<ApiResponse<WorkspaceResponse>> updateBranch(
      @Parameter(description = "ID workspace cha") @PathVariable Long workspaceId,
      @Parameter(description = "ID chi nhánh") @PathVariable Long branchId,
      @Valid @RequestBody UpdateWorkspaceRequest request) {

    WorkspaceResponse data = workspaceService.updateBranch(workspaceId, branchId, request);
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật chi nhánh thành công", data));
  }

  @Tag(name = "Workspace - Branches")
  @Operation(summary = "Xoá chi nhánh (soft delete)")
  @DeleteMapping("/api/workspace/{workspaceId}/branches/{branchId}")
  public ResponseEntity<ApiResponse<Void>> deleteBranch(
      @Parameter(description = "ID workspace cha") @PathVariable Long workspaceId,
      @Parameter(description = "ID chi nhánh") @PathVariable Long branchId) {

    workspaceService.deleteBranch(workspaceId, branchId);
    return ResponseEntity.ok(ApiResponse.success(200, "Xoá chi nhánh thành công", null));
  }

  // ================================================================
  // SUPER_ADMIN + ADMIN — Members (/api/workspace/{id}/members)
  // ================================================================

  @Tag(name = "Workspace - Members", description = "Quản lý thành viên workspace — SUPER_ADMIN và ADMIN")
  @Operation(summary = "Thêm thành viên vào workspace", description = """
      - SUPER_ADMIN: thêm ADMIN vào workspace cha, AGENT vào chi nhánh
      - ADMIN: chỉ được thêm AGENT vào workspace của mình
      """)
  @PostMapping("/api/workspace/{workspaceId}/members")
  public ResponseEntity<ApiResponse<MemberResponse>> addMember(
      @Parameter(description = "ID workspace") @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails,
      @Valid @RequestBody AddMemberRequest request) {

    MemberResponse data = memberService.addMember(
        workspaceId, request, userDetails.getUsername());
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success(201, "Thêm thành viên thành công", data));
  }

  @Tag(name = "Workspace - Members")
  @Operation(summary = "Lấy danh sách thành viên của workspace")
  @GetMapping("/api/workspace/{workspaceId}/members")
  public ResponseEntity<ApiResponse<List<MemberResponse>>> getMembers(
      @Parameter(description = "ID workspace") @PathVariable Long workspaceId,
      @AuthenticationPrincipal UserDetails userDetails) {

    List<MemberResponse> data = memberService.getMembers(
        workspaceId, userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "OK", data));
  }

  @Tag(name = "Workspace - Members")
  @Operation(summary = "Bật/tắt trạng thái thành viên")
  @PatchMapping("/api/workspace/{workspaceId}/members/{memberId}/toggle-active")
  public ResponseEntity<ApiResponse<MemberResponse>> toggleMemberActive(
      @Parameter(description = "ID workspace") @PathVariable Long workspaceId,
      @Parameter(description = "ID membership") @PathVariable Long memberId,
      @AuthenticationPrincipal UserDetails userDetails) {

    MemberResponse data = memberService.toggleMemberActive(
        workspaceId, memberId, userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Cập nhật trạng thái thành công", data));
  }

  @Tag(name = "Workspace - Members")
  @Operation(summary = "Xoá thành viên khỏi workspace")
  @DeleteMapping("/api/workspace/{workspaceId}/members/{memberId}")
  public ResponseEntity<ApiResponse<Void>> removeMember(
      @Parameter(description = "ID workspace") @PathVariable Long workspaceId,
      @Parameter(description = "ID membership") @PathVariable Long memberId,
      @AuthenticationPrincipal UserDetails userDetails) {

    memberService.removeMember(workspaceId, memberId, userDetails.getUsername());
    return ResponseEntity.ok(ApiResponse.success(200, "Xoá thành viên thành công", null));
  }
}
