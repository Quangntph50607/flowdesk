package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.CreateWorkspaceRequest;
import com.example.flowdesk_be.dto.request.UpdateWorkspaceRequest;
import com.example.flowdesk_be.dto.response.WorkspaceResponse;
import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.entity.Workspace;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.UserRepository;
import com.example.flowdesk_be.repository.WorkspaceRepository;
import com.example.flowdesk_be.service.WorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceServiceImpl implements WorkspaceService {

  private final WorkspaceRepository workspaceRepository;
  private final UserRepository userRepository;

  // ---- Workspace cha (level = 0) ----

  @Override
  @Transactional
  public WorkspaceResponse createWorkspace(String ownerEmail, CreateWorkspaceRequest request) {
    if (workspaceRepository.existsBySlug(request.getSlug())) {
      throw AppException.conflict("Slug '" + request.getSlug() + "' đã tồn tại");
    }

    User owner = findUserOrThrow(ownerEmail);

    Workspace workspace = Workspace.builder()
        .name(request.getName())
        .slug(request.getSlug())
        .owner(owner)
        .level(0)
        .isActive(true)
        .build();

    return WorkspaceResponse.from(workspaceRepository.save(workspace));
  }

  @Override
  public List<WorkspaceResponse> getAllWorkspaces() {
    return workspaceRepository.findAllByLevelAndIsActiveTrue(0)
        .stream()
        .map(WorkspaceResponse::from)
        .toList();
  }

  @Override
  public WorkspaceResponse getWorkspaceById(Long id) {
    Workspace ws = findWorkspaceOrThrow(id);

    WorkspaceResponse response = WorkspaceResponse.from(ws);

    // Kèm theo danh sách branch
    List<WorkspaceResponse> children = workspaceRepository
        .findAllByParentIdAndIsActiveTrue(id)
        .stream()
        .map(WorkspaceResponse::from)
        .toList();
    response.setChildren(children);

    return response;
  }

  @Override
  @Transactional
  public WorkspaceResponse updateWorkspace(Long id, UpdateWorkspaceRequest request) {
    Workspace ws = findWorkspaceOrThrow(id);

    if (request.getName() != null && !request.getName().isBlank()) {
      ws.setName(request.getName());
    }

    return WorkspaceResponse.from(workspaceRepository.save(ws));
  }

  @Override
  @Transactional
  public void deleteWorkspace(Long id) {
    Workspace ws = findWorkspaceOrThrow(id);
    ws.setIsActive(false);

    // Soft delete tất cả chi nhánh con
    workspaceRepository.findAllByParentIdAndIsActiveTrue(id)
        .forEach(branch -> branch.setIsActive(false));

    workspaceRepository.save(ws);
  }

  // ---- Branch (level = 1) ----

  @Override
  @Transactional
  public WorkspaceResponse createBranch(Long parentId, String ownerEmail,
      CreateWorkspaceRequest request) {

    Workspace parent = findWorkspaceOrThrow(parentId);

    if (parent.getLevel() != 0) {
      throw AppException.badRequest("Chỉ có thể tạo chi nhánh trong workspace cấp công ty");
    }
    if (workspaceRepository.existsBySlug(request.getSlug())) {
      throw AppException.conflict("Slug '" + request.getSlug() + "' đã tồn tại");
    }

    User owner = findUserOrThrow(ownerEmail);

    Workspace branch = Workspace.builder()
        .name(request.getName())
        .slug(request.getSlug())
        .owner(owner)
        .parent(parent)
        .level(1)
        .isActive(true)
        .build();

    return WorkspaceResponse.from(workspaceRepository.save(branch));
  }

  @Override
  public List<WorkspaceResponse> getBranches(Long parentId) {
    findWorkspaceOrThrow(parentId); // validate parent tồn tại
    return workspaceRepository.findAllByParentIdAndIsActiveTrue(parentId)
        .stream()
        .map(WorkspaceResponse::from)
        .toList();
  }

  @Override
  @Transactional
  public WorkspaceResponse updateBranch(Long parentId, Long branchId,
      UpdateWorkspaceRequest request) {

    Workspace branch = findBranchOrThrow(parentId, branchId);

    if (request.getName() != null && !request.getName().isBlank()) {
      branch.setName(request.getName());
    }

    return WorkspaceResponse.from(workspaceRepository.save(branch));
  }

  @Override
  @Transactional
  public void deleteBranch(Long parentId, Long branchId) {
    Workspace branch = findBranchOrThrow(parentId, branchId);
    branch.setIsActive(false);
    workspaceRepository.save(branch);
  }

  // ---- helpers ----

  private Workspace findWorkspaceOrThrow(Long id) {
    return workspaceRepository.findById(id)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy workspace với id: " + id));
  }

  private Workspace findBranchOrThrow(Long parentId, Long branchId) {
    Workspace branch = findWorkspaceOrThrow(branchId);
    if (branch.getParent() == null || !branch.getParent().getId().equals(parentId)) {
      throw AppException.notFound("Chi nhánh không thuộc workspace này");
    }
    return branch;
  }

  private User findUserOrThrow(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));
  }
}
