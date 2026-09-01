package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.CreateWorkspaceRequest;
import com.example.flowdesk_be.dto.request.UpdateWorkspaceRequest;
import com.example.flowdesk_be.dto.response.WorkspaceResponse;

import java.util.List;

public interface WorkspaceService {

  // ---- SUPER_ADMIN: workspace tổng ----
  WorkspaceResponse createWorkspace(String requesterEmail, CreateWorkspaceRequest request);

  List<WorkspaceResponse> getAllWorkspaces();

  List<WorkspaceResponse> getAllWorkspaces(String search);

  WorkspaceResponse getWorkspaceById(Long id);

  WorkspaceResponse updateWorkspace(Long id, UpdateWorkspaceRequest request);

  void deleteWorkspace(Long id);

  // ---- OWNER + ADMIN: chi nhánh ----
  WorkspaceResponse createBranch(Long parentId, String requesterEmail, CreateWorkspaceRequest request);

  List<WorkspaceResponse> getBranches(Long parentId);

  WorkspaceResponse updateBranch(Long parentId, Long branchId, UpdateWorkspaceRequest request);

  void deleteBranch(Long parentId, Long branchId);

  // ---- Dùng chung: lấy workspace mà user là thành viên ----
  WorkspaceResponse getWorkspaceForMember(Long workspaceId, String requesterEmail);
}
