package com.example.flowdesk_be.service;

import com.example.flowdesk_be.dto.request.CreateWorkspaceRequest;
import com.example.flowdesk_be.dto.request.UpdateWorkspaceRequest;
import com.example.flowdesk_be.dto.response.WorkspaceResponse;

import java.util.List;

public interface WorkspaceService {

  // ---- SUPER_ADMIN: workspace cha ----
  WorkspaceResponse createWorkspace(String ownerEmail, CreateWorkspaceRequest request);

  List<WorkspaceResponse> getAllWorkspaces();

  WorkspaceResponse getWorkspaceById(Long id);

  WorkspaceResponse updateWorkspace(Long id, UpdateWorkspaceRequest request);

  void deleteWorkspace(Long id); // soft delete

  // ---- SUPER_ADMIN + ADMIN: branch (workspace con) ----
  WorkspaceResponse createBranch(Long parentId, String ownerEmail, CreateWorkspaceRequest request);

  List<WorkspaceResponse> getBranches(Long parentId);

  WorkspaceResponse updateBranch(Long parentId, Long branchId, UpdateWorkspaceRequest request);

  void deleteBranch(Long parentId, Long branchId); // soft delete
}
