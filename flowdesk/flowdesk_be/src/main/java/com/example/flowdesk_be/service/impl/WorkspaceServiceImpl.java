package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.CreateWorkspaceRequest;
import com.example.flowdesk_be.dto.request.UpdateWorkspaceRequest;
import com.example.flowdesk_be.dto.response.WorkspaceResponse;
import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.entity.Workspace;
import com.example.flowdesk_be.entity.WorkspaceMember;
import com.example.flowdesk_be.entity.Role;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.RoleRepository;
import com.example.flowdesk_be.repository.UserRepository;
import com.example.flowdesk_be.repository.WorkspaceMemberRepository;
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
  private final WorkspaceMemberRepository memberRepository;
  private final UserRepository userRepository;

  private final RoleRepository roleRepository;

  // ================================================================
  // SUPER_ADMIN — Workspace tổng (level = 0)
  // ================================================================

  @Override
  @Transactional
  public WorkspaceResponse createWorkspace(String requesterEmail, CreateWorkspaceRequest request) {
    if (workspaceRepository.existsBySlug(request.getSlug())) {
      throw AppException.conflict("Slug '" + request.getSlug() + "' đã tồn tại");
    }

    // Owner là người được chỉ định qua ownerEmail, không phải SUPER_ADMIN
    String ownerEmail = (request.getOwnerEmail() != null && !request.getOwnerEmail().isBlank())
        ? request.getOwnerEmail()
        : requesterEmail;

    User owner = userRepository.findByEmail(ownerEmail)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user với email: " + ownerEmail));

    Workspace workspace = Workspace.builder()
        .name(request.getName())
        .slug(request.getSlug())
        .owner(owner)
        .level(0)
        .isActive(true)
        .build();

    workspace = workspaceRepository.save(workspace);

    // Tự động tạo workspace_members record với role OWNER
    Role ownerRole = roleRepository.findByCode("OWNER")
        .orElseThrow(() -> AppException.notFound("Không tìm thấy role OWNER"));

    WorkspaceMember member = WorkspaceMember.builder()
        .workspace(workspace)
        .user(owner)
        .role(ownerRole)
        .isActive(true)
        .build();
    memberRepository.save(member);

    return WorkspaceResponse.from(workspace);
  }

  @Override
  public List<WorkspaceResponse> getAllWorkspaces() {
    return getAllWorkspaces(null);
  }

  @Override
  public List<WorkspaceResponse> getAllWorkspaces(String search) {
    List<Workspace> list = (search == null || search.isBlank())
        ? workspaceRepository.findAllByLevelAndIsActiveTrue(0)
        : workspaceRepository.findByLevelAndIsActiveTrueAndNameContainingIgnoreCase(0, search);

    return list.stream().map(ws -> {
      WorkspaceResponse res = WorkspaceResponse.from(ws);
      res.setChildren(
          workspaceRepository.findAllByParentIdAndIsActiveTrue(ws.getId())
              .stream().map(WorkspaceResponse::from).toList());
      return res;
    }).toList();
  }

  @Override
  public WorkspaceResponse getWorkspaceById(Long id) {
    Workspace ws = findWorkspaceOrThrow(id);
    WorkspaceResponse res = WorkspaceResponse.from(ws);
    res.setChildren(
        workspaceRepository.findAllByParentIdAndIsActiveTrue(id)
            .stream().map(WorkspaceResponse::from).toList());
    return res;
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
    List<Workspace> branches = workspaceRepository.findAllByParentIdAndIsActiveTrue(id);
    branches.forEach(b -> b.setIsActive(false));
    workspaceRepository.saveAll(branches);

    workspaceRepository.save(ws);
  }

  // ================================================================
  // OWNER + ADMIN — Chi nhánh (level = 1)
  // ================================================================

  @Override
  @Transactional
  public WorkspaceResponse createBranch(Long parentId, String requesterEmail,
      CreateWorkspaceRequest request) {

    Workspace parent = findWorkspaceOrThrow(parentId);
    if (parent.getLevel() != 0) {
      throw AppException.badRequest("Chỉ có thể tạo chi nhánh trong workspace tổng");
    }
    if (workspaceRepository.existsBySlug(request.getSlug())) {
      throw AppException.conflict("Slug '" + request.getSlug() + "' đã tồn tại");
    }

    User requester = findUserOrThrow(requesterEmail);

    // Kiểm tra requester là OWNER hoặc ADMIN của workspace tổng này
    assertOwnerOrAdmin(requester, parentId);

    Workspace branch = Workspace.builder()
        .name(request.getName())
        .slug(request.getSlug())
        .owner(requester)
        .parent(parent)
        .level(1)
        .isActive(true)
        .build();

    return WorkspaceResponse.from(workspaceRepository.save(branch));
  }

  @Override
  public List<WorkspaceResponse> getBranches(Long parentId) {
    findWorkspaceOrThrow(parentId);
    return workspaceRepository.findAllByParentIdAndIsActiveTrue(parentId)
        .stream().map(WorkspaceResponse::from).toList();
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

  // ================================================================
  // Dùng chung
  // ================================================================

  @Override
  public WorkspaceResponse getWorkspaceForMember(Long workspaceId, String requesterEmail) {
    User requester = findUserOrThrow(requesterEmail);

    // SUPER_ADMIN xem được tất cả
    if (!requester.isSuperAdmin()) {
      // Kiểm tra user có phải member của workspace này không
      if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, requester.getId())) {
        // Hoặc là OWNER/ADMIN của workspace cha (nếu đây là chi nhánh)
        Workspace ws = findWorkspaceOrThrow(workspaceId);
        if (ws.getLevel() == 1 && ws.getParent() != null) {
          if (!memberRepository.existsByWorkspaceIdAndUserId(
              ws.getParent().getId(), requester.getId())) {
            throw AppException.forbidden("Bạn không có quyền truy cập workspace này");
          }
        } else {
          throw AppException.forbidden("Bạn không có quyền truy cập workspace này");
        }
      }
    }

    return getWorkspaceById(workspaceId);
  }

  // ================================================================
  // Helpers
  // ================================================================

  private Workspace findWorkspaceOrThrow(Long id) {
    return workspaceRepository.findById(id)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy workspace id: " + id));
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

  // Kiểm tra user có role OWNER hoặc ADMIN tại workspace tổng (parentId)
  private void assertOwnerOrAdmin(User user, Long workspaceId) {
    if (user.isSuperAdmin())
      return;
    memberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId())
        .filter(m -> m.getIsActive()
            && (m.getRole().getCode().equals("OWNER")
                || m.getRole().getCode().equals("ADMIN")))
        .orElseThrow(() -> AppException.forbidden("Bạn không có quyền thực hiện thao tác này"));
  }
}
