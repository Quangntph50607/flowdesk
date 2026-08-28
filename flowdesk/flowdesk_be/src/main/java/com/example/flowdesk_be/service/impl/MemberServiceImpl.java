package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.AddMemberRequest;
import com.example.flowdesk_be.dto.response.MemberResponse;
import com.example.flowdesk_be.entity.Role;
import com.example.flowdesk_be.entity.User;
import com.example.flowdesk_be.entity.Workspace;
import com.example.flowdesk_be.entity.WorkspaceMember;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.RoleRepository;
import com.example.flowdesk_be.repository.UserRepository;
import com.example.flowdesk_be.repository.WorkspaceMemberRepository;
import com.example.flowdesk_be.repository.WorkspaceRepository;
import com.example.flowdesk_be.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

  private final WorkspaceMemberRepository memberRepository;
  private final WorkspaceRepository workspaceRepository;
  private final UserRepository userRepository;
  private final RoleRepository roleRepository;

  @Override
  @Transactional
  public MemberResponse addMember(Long workspaceId, AddMemberRequest request,
      String requesterEmail) {

    Workspace workspace = findWorkspaceOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);

    // Kiểm tra quyền: SUPER_ADMIN được tất cả, ADMIN chỉ được thêm vào workspace
    // của mình
    if (!requester.isSuperAdmin()) {
      assertAdminOfWorkspace(requester, workspaceId);

      // ADMIN chỉ được thêm AGENT, không được thêm ADMIN khác
      if ("ADMIN".equals(request.getRoleCode())) {
        throw AppException.forbidden("ADMIN không có quyền thêm ADMIN khác");
      }
    }

    // Validate role rule theo workspace level
    validateRoleForLevel(request.getRoleCode(), workspace.getLevel());

    // Kiểm tra user chưa là member
    if (memberRepository.existsByWorkspaceIdAndUserId(workspaceId, request.getUserId())) {
      throw AppException.conflict("User đã là thành viên của workspace này");
    }

    User newMember = userRepository.findById(request.getUserId())
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user với id: " + request.getUserId()));

    Role role = roleRepository.findByCode(request.getRoleCode())
        .orElseThrow(() -> AppException.notFound("Không tìm thấy role: " + request.getRoleCode()));

    WorkspaceMember member = WorkspaceMember.builder()
        .workspace(workspace)
        .user(newMember)
        .role(role)
        .isActive(true)
        .build();

    return MemberResponse.from(memberRepository.save(member));
  }

  @Override
  @Transactional(readOnly = true)
  public List<MemberResponse> getMembers(Long workspaceId, String requesterEmail) {
    findWorkspaceOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);

    // ADMIN chỉ được xem workspace của mình
    if (!requester.isSuperAdmin()) {
      assertAdminOfWorkspace(requester, workspaceId);
    }

    return memberRepository.findAllByWorkspaceIdAndIsActiveTrue(workspaceId)
        .stream()
        .map(MemberResponse::from)
        .toList();
  }

  @Override
  @Transactional
  public MemberResponse toggleMemberActive(Long workspaceId, Long memberId,
      String requesterEmail) {

    WorkspaceMember member = findMemberOrThrow(memberId, workspaceId);
    User requester = findUserOrThrow(requesterEmail);

    if (!requester.isSuperAdmin()) {
      assertAdminOfWorkspace(requester, workspaceId);
    }

    member.setIsActive(!member.getIsActive());
    return MemberResponse.from(memberRepository.save(member));
  }

  @Override
  @Transactional
  public void removeMember(Long workspaceId, Long memberId, String requesterEmail) {
    WorkspaceMember member = findMemberOrThrow(memberId, workspaceId);
    User requester = findUserOrThrow(requesterEmail);

    if (!requester.isSuperAdmin()) {
      assertAdminOfWorkspace(requester, workspaceId);
    }

    memberRepository.delete(member);
  }

  // ---- helpers ----

  private Workspace findWorkspaceOrThrow(Long workspaceId) {
    return workspaceRepository.findById(workspaceId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy workspace với id: " + workspaceId));
  }

  private User findUserOrThrow(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));
  }

  private WorkspaceMember findMemberOrThrow(Long memberId, Long workspaceId) {
    WorkspaceMember member = memberRepository.findById(memberId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy member với id: " + memberId));
    if (!member.getWorkspace().getId().equals(workspaceId)) {
      throw AppException.notFound("Member không thuộc workspace này");
    }
    return member;
  }

  // ADMIN phải là member active của workspace đó với role ADMIN.
  // Nếu workspace là chi nhánh (level=1), kiểm tra quyền trên workspace cha.
  private void assertAdminOfWorkspace(User requester, Long workspaceId) {
    Workspace workspace = findWorkspaceOrThrow(workspaceId);

    // Xác định workspace cần kiểm tra quyền:
    // - level 0 (workspace cha): kiểm tra trực tiếp
    // - level 1 (chi nhánh): kiểm tra trên workspace cha
    Long checkWorkspaceId;
    if (workspace.getLevel() == 1) {
      if (workspace.getParent() == null) {
        throw AppException.forbidden("Bạn không có quyền trên workspace này");
      }
      checkWorkspaceId = workspace.getParent().getId();
    } else {
      checkWorkspaceId = workspaceId;
    }

    WorkspaceMember membership = memberRepository
        .findByWorkspaceIdAndUserId(checkWorkspaceId, requester.getId())
        .orElseThrow(() -> AppException.forbidden("Bạn không có quyền trên workspace này"));

    if (!"ADMIN".equals(membership.getRole().getCode()) || !membership.getIsActive()) {
      throw AppException.forbidden("Bạn không có quyền trên workspace này");
    }
  }

  // ADMIN → gán vào workspace cha (level=0), AGENT → gán vào workspace con
  // (level=1)
  private void validateRoleForLevel(String roleCode, int level) {
    if ("ADMIN".equals(roleCode) && level != 0) {
      throw AppException.badRequest("ADMIN chỉ được gán vào workspace cấp công ty (level 0)");
    }
    if ("AGENT".equals(roleCode) && level != 1) {
      throw AppException.badRequest("AGENT chỉ được gán vào chi nhánh (level 1)");
    }
  }
}
