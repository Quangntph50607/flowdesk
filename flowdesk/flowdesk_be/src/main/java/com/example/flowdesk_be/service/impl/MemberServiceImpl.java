package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.AddMemberRequest;
import com.example.flowdesk_be.dto.response.MemberGroupResponse;
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

    // Phân quyền: ai được thêm ai vào đâu
    authorizeAddMember(requester, workspace, request.getRoleCode());

    // Kiểm tra user chưa là member
    if (memberRepository.existsByWorkspaceIdAndUserId(workspaceId, request.getUserId())) {
      throw AppException.conflict("User đã là thành viên của workspace này");
    }

    User newMember = userRepository.findById(request.getUserId())
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user id: " + request.getUserId()));

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
  public List<MemberResponse> getAllMembersFlat(Long workspaceId, String requesterEmail) {
    Workspace parentWs = findWorkspaceOrThrow(workspaceId);
    if (parentWs.getLevel() != 0) {
      throw AppException.badRequest("Chỉ hỗ trợ lấy tất cả member từ workspace tổng (level=0)");
    }

    User requester = findUserOrThrow(requesterEmail);
    if (!requester.isSuperAdmin()) {
      assertCanAccessWorkspace(requester, workspaceId);
    }

    // Lấy danh sách id: workspace tổng + tất cả chi nhánh
    List<Long> allWorkspaceIds = new java.util.ArrayList<>();
    allWorkspaceIds.add(workspaceId);
    workspaceRepository.findAllByParentIdAndIsActiveTrue(workspaceId)
        .forEach(b -> allWorkspaceIds.add(b.getId()));

    return memberRepository.findAllByWorkspaceIdIn(allWorkspaceIds)
        .stream()
        .map(MemberResponse::from)
        .toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<MemberGroupResponse> getAllMembersGrouped(Long workspaceId, String requesterEmail) {
    List<MemberResponse> flat = getAllMembersFlat(workspaceId, requesterEmail);

    // Group theo userId — giữ thứ tự insert (LinkedHashMap)
    java.util.Map<Long, MemberGroupResponse> map = new java.util.LinkedHashMap<>();

    for (MemberResponse m : flat) {
      map.computeIfAbsent(m.getUserId(), uid -> {
        MemberGroupResponse g = new MemberGroupResponse();
        g.setUserId(uid);
        g.setEmail(m.getEmail());
        g.setFullName(m.getFullName());
        g.setAvatarUrl(m.getAvatarUrl());
        g.setMemberships(new java.util.ArrayList<>());
        return g;
      });

      MemberGroupResponse g = map.get(m.getUserId());
      g.getMemberships().add(m);

      // Membership workspace tổng (branchId == null) → dùng làm "account" chính
      if (m.getBranchId() == null) {
        g.setRoleCode(m.getRoleCode());
        g.setRoleName(m.getRoleName());
        g.setAccountActive(m.getIsActive());
        g.setWorkspaceMemberId(m.getId());
        g.setWorkspaceId(m.getWorkspaceId());
      }
    }

    // Tính branchLabels cho từng group
    for (MemberGroupResponse g : map.values()) {
      java.util.List<String> names = g.getMemberships().stream()
          .filter(m -> m.getBranchName() != null)
          .map(MemberResponse::getBranchName)
          .distinct()
          .toList();

      if (!names.isEmpty()) {
        String label = names.size() <= 2
            ? String.join(", ", names)
            : String.join(", ", names.subList(0, 2)) + " +" + (names.size() - 2) + "...";
        g.setBranchLabels(label);
      }

      // Fallback: nếu user chỉ có trong chi nhánh (không có membership workspace
      // tổng)
      // lấy role từ membership đầu tiên
      if (g.getRoleCode() == null && !g.getMemberships().isEmpty()) {
        MemberResponse first = g.getMemberships().get(0);
        g.setRoleCode(first.getRoleCode());
        g.setRoleName(first.getRoleName());
        g.setAccountActive(first.getIsActive());
        g.setWorkspaceMemberId(first.getId());
        g.setWorkspaceId(first.getWorkspaceId());
      }
    }

    return new java.util.ArrayList<>(map.values());
  }

  @Override
  @Transactional(readOnly = true)
  public List<MemberResponse> getMembers(Long workspaceId, String requesterEmail) {
    return getMembers(workspaceId, requesterEmail, null);
  }

  @Override
  @Transactional(readOnly = true)
  public List<MemberResponse> getMembers(Long workspaceId, String requesterEmail, String search) {
    findWorkspaceOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);

    // SUPER_ADMIN xem tất cả, còn lại phải là member của workspace đó
    // hoặc OWNER/ADMIN của workspace cha (nếu đây là chi nhánh)
    if (!requester.isSuperAdmin()) {
      assertCanAccessWorkspace(requester, workspaceId);
    }

    List<WorkspaceMember> members = search == null || search.isBlank()
        ? memberRepository.findAllByWorkspaceId(workspaceId)
        : memberRepository.searchByWorkspaceId(workspaceId, search);
    return members
        .stream().map(MemberResponse::from).toList();
  }

  @Override
  @Transactional
  public MemberResponse toggleMemberActive(Long workspaceId, Long memberId,
      String requesterEmail) {

    WorkspaceMember member = findMemberOrThrow(memberId, workspaceId);
    User requester = findUserOrThrow(requesterEmail);

    if (!requester.isSuperAdmin()) {
      assertOwnerOrAdminOfParent(requester, workspaceId);
    }

    // Không cho tắt chính OWNER
    if ("OWNER".equals(member.getRole().getCode())) {
      throw AppException.forbidden("Không thể vô hiệu hoá OWNER workspace");
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
      assertOwnerOrAdminOfParent(requester, workspaceId);
    }

    // Không cho xóa OWNER
    if ("OWNER".equals(member.getRole().getCode())) {
      throw AppException.forbidden("Không thể xóa OWNER khỏi workspace");
    }

    memberRepository.delete(member);
  }

  // ================================================================
  // Helpers — Authorization
  // ================================================================

  /**
   * Quy tắc thêm member:
   *
   * SUPER_ADMIN:
   * - Thêm OWNER/ADMIN vào workspace tổng (level=0)
   * - Thêm AGENT vào chi nhánh (level=1) hoặc workspace tổng không có chi nhánh
   *
   * OWNER của workspace tổng:
   * - Thêm ADMIN vào workspace tổng của mình
   * - Thêm AGENT vào chi nhánh (hoặc workspace tổng nếu không có branch)
   *
   * ADMIN của workspace tổng:
   * - Thêm AGENT vào chi nhánh (hoặc workspace tổng nếu không có branch)
   * - Không được thêm ADMIN hay OWNER
   */
  private void authorizeAddMember(User requester, Workspace workspace, String roleCode) {
    if (requester.isSuperAdmin())
      return;

    // Xác định workspace tổng để kiểm tra quyền
    Long parentWorkspaceId;
    if (workspace.getLevel() == 0) {
      parentWorkspaceId = workspace.getId();
    } else {
      // chi nhánh — lấy workspace cha
      if (workspace.getParent() == null) {
        throw AppException.badRequest("Chi nhánh không có workspace cha");
      }
      parentWorkspaceId = workspace.getParent().getId();
    }

    WorkspaceMember requesterMembership = memberRepository
        .findByWorkspaceIdAndUserId(parentWorkspaceId, requester.getId())
        .orElseThrow(() -> AppException.forbidden("Bạn không có quyền quản lý workspace này"));

    if (!requesterMembership.getIsActive()) {
      throw AppException.forbidden("Tài khoản của bạn đã bị vô hiệu hoá trong workspace này");
    }

    String requesterRole = requesterMembership.getRole().getCode();

    // OWNER có thể thêm ADMIN, AGENT
    if ("OWNER".equals(requesterRole)) {
      if ("OWNER".equals(roleCode)) {
        throw AppException.forbidden("Không thể thêm OWNER khác vào workspace");
      }
      return;
    }

    // ADMIN chỉ được thêm AGENT
    if ("ADMIN".equals(requesterRole)) {
      if (!"AGENT".equals(roleCode)) {
        throw AppException.forbidden("ADMIN chỉ được thêm AGENT vào workspace");
      }
      return;
    }

    throw AppException.forbidden("Bạn không có quyền thêm thành viên");
  }

  private void assertOwnerOrAdminOfParent(User user, Long workspaceId) {
    Workspace workspace = findWorkspaceOrThrow(workspaceId);

    // Nếu là chi nhánh, kiểm tra quyền trên workspace cha
    Long checkId = workspace.getLevel() == 1 && workspace.getParent() != null
        ? workspace.getParent().getId()
        : workspaceId;

    WorkspaceMember m = memberRepository.findByWorkspaceIdAndUserId(checkId, user.getId())
        .orElseThrow(() -> AppException.forbidden("Bạn không có quyền thực hiện thao tác này"));

    if (!m.getIsActive() || (!m.getRole().getCode().equals("OWNER")
        && !m.getRole().getCode().equals("ADMIN"))) {
      throw AppException.forbidden("Bạn không có quyền thực hiện thao tác này");
    }
  }

  private void assertCanAccessWorkspace(User user, Long workspaceId) {
    // Có thể là member trực tiếp
    if (memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId()))
      return;

    // Hoặc là OWNER/ADMIN của workspace cha
    Workspace workspace = findWorkspaceOrThrow(workspaceId);
    if (workspace.getLevel() == 1 && workspace.getParent() != null) {
      if (memberRepository.existsByWorkspaceIdAndUserId(
          workspace.getParent().getId(), user.getId()))
        return;
    }

    throw AppException.forbidden("Bạn không có quyền truy cập workspace này");
  }

  // ================================================================
  // Helpers — Finders
  // ================================================================

  private Workspace findWorkspaceOrThrow(Long workspaceId) {
    return workspaceRepository.findById(workspaceId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy workspace id: " + workspaceId));
  }

  private User findUserOrThrow(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));
  }

  private WorkspaceMember findMemberOrThrow(Long memberId, Long workspaceId) {
    WorkspaceMember member = memberRepository.findById(memberId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy member id: " + memberId));
    if (!member.getWorkspace().getId().equals(workspaceId)) {
      throw AppException.notFound("Member không thuộc workspace này");
    }
    return member;
  }
}
