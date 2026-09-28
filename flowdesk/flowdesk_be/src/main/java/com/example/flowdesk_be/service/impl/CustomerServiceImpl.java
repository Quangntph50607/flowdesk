package com.example.flowdesk_be.service.impl;

import com.example.flowdesk_be.dto.request.CustomerRequest;
import com.example.flowdesk_be.dto.request.CustomerTagRequest;
import com.example.flowdesk_be.dto.response.CustomerActivityResponse;
import com.example.flowdesk_be.dto.response.CustomerResponse;
import com.example.flowdesk_be.dto.response.CustomerTagResponse;
import com.example.flowdesk_be.entity.*;
import com.example.flowdesk_be.exception.AppException;
import com.example.flowdesk_be.repository.*;
import com.example.flowdesk_be.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

  private static final Set<String> VALID_STATUSES = Set.of(
      "NEW", "CONTACTING", "POTENTIAL", "QUOTED", "WON", "LOST");

  private final CustomerRepository customerRepository;
  private final CustomerTagRepository tagRepository;
  private final CustomerTagAssignmentRepository tagAssignmentRepository;
  private final CustomerActivityRepository activityRepository;
  private final WorkspaceRepository workspaceRepository;
  private final WorkspaceMemberRepository memberRepository;
  private final UserRepository userRepository;

  @Override
  @Transactional(readOnly = true)
  public List<CustomerResponse> getAccessibleCustomers(String requesterEmail, Long workspaceId, Long branchId,
      String search, String status, Long tagId) {
    User requester = findUserOrThrow(requesterEmail);
    Long normalizedWorkspaceId = workspaceId;
    Long normalizedBranchId = branchId;
    String normalizedSearch = blankToNull(search);
    String normalizedStatus = normalizeStatus(status);

    if (normalizedWorkspaceId != null) {
      findWorkspaceRootOrThrow(normalizedWorkspaceId);
    }
    if (normalizedBranchId != null) {
      Workspace branch = workspaceRepository.findById(normalizedBranchId)
          .orElseThrow(() -> AppException.notFound("Không tìm thấy chi nhánh"));
      if (branch.getLevel() != 1 || branch.getParent() == null) {
        throw AppException.badRequest("branchId không hợp lệ");
      }
      if (normalizedWorkspaceId != null && !branch.getParent().getId().equals(normalizedWorkspaceId)) {
        throw AppException.badRequest("Chi nhánh không thuộc workspace đã chọn");
      }
    }
    if (tagId != null) {
      tagRepository.findById(tagId).orElseThrow(() -> AppException.notFound("Không tìm thấy tag"));
    }

    List<Customer> customers;
    if (requester.isSuperAdmin()) {
      customers = customerRepository.searchAllCustomers(normalizedWorkspaceId, normalizedBranchId, normalizedStatus,
          tagId, normalizedSearch);
    } else {
      AccessibleCustomerScope scope = resolveAccessibleCustomerScope(requester);
      assertCanUseGlobalFilters(scope, normalizedWorkspaceId, normalizedBranchId);
      customers = searchByScope(scope, normalizedWorkspaceId, normalizedBranchId, normalizedStatus, tagId,
          normalizedSearch);
    }

    return customers.stream().map(CustomerResponse::from).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public List<CustomerResponse> getCustomers(Long workspaceId, String requesterEmail, String search,
      Long branchId, String status, Long tagId) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);
    AccessScope scope = resolveAccessScope(workspace, requester);

    String normalizedSearch = blankToNull(search);
    String normalizedStatus = normalizeStatus(status);
    Long normalizedBranchId = branchId;
    if (normalizedBranchId != null) {
      Workspace branch = findBranchInWorkspace(workspace, normalizedBranchId);
      if (!scope.canSeeAll() && !scope.branchIds().contains(branch.getId())) {
      throw AppException.forbidden("Bạn không có quyền xem chi nhánh này");
      }
    }
    if (tagId != null) {
      tagRepository.findById(tagId)
          .filter(tag -> tag.getWorkspace().getId().equals(workspace.getId()))
          .orElseThrow(() -> AppException.notFound("Không tìm thấy tag"));
    }

    List<Customer> customers = scope.canSeeAll()
        ? customerRepository.searchWorkspaceCustomers(workspace.getId(), normalizedBranchId, normalizedStatus, tagId,
            normalizedSearch)
        : customerRepository.searchBranchCustomers(workspace.getId(), scope.branchIds(), normalizedBranchId,
            normalizedStatus, tagId, normalizedSearch);

    return customers.stream().map(CustomerResponse::from).toList();
  }

  @Override
  @Transactional(readOnly = true)
  public CustomerResponse getCustomer(Long workspaceId, Long customerId, String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);
    Customer customer = findCustomerOrThrow(customerId, workspace.getId());
    assertCanAccessCustomer(workspace, requester, customer);
    return CustomerResponse.from(customer);
  }

  @Override
  @Transactional
  public CustomerResponse createCustomer(Long workspaceId, CustomerRequest request, String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);
    resolveAccessScope(workspace, requester);

    Workspace branch = findBranchInWorkspace(workspace, request.getBranchId());
    User assignedUser = findAssignedUser(workspace, request.getAssignedUserId());

    Customer customer = Customer.builder()
        .workspace(workspace)
        .branch(branch)
        .assignedUser(assignedUser)
        .createdBy(requester)
        .name(request.getName().trim())
        .phone(blankToNull(request.getPhone()))
        .email(blankToNull(request.getEmail()))
        .address(blankToNull(request.getAddress()))
        .source(blankToNull(request.getSource()))
        .status(normalizeStatusOrDefault(request.getStatus()))
        .note(blankToNull(request.getNote()))
        .build();

    Customer saved = customerRepository.save(customer);
    syncTags(saved, workspace, request.getTagIds());
    log(saved, requester, "CREATE", "Tạo khách hàng");
    return CustomerResponse.from(findCustomerOrThrow(saved.getId(), workspace.getId()));
  }

  @Override
  @Transactional
  public CustomerResponse updateCustomer(Long workspaceId, Long customerId, CustomerRequest request,
      String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);
    Customer customer = findCustomerOrThrow(customerId, workspace.getId());

    assertCanAccessCustomer(workspace, requester, customer);
    Workspace oldBranch = customer.getBranch();
    Workspace newBranch = findBranchInWorkspace(workspace, request.getBranchId());
    User assignedUser = findAssignedUser(workspace, request.getAssignedUserId());

    customer.setName(request.getName().trim());
    customer.setPhone(blankToNull(request.getPhone()));
    customer.setEmail(blankToNull(request.getEmail()));
    customer.setAddress(blankToNull(request.getAddress()));
    customer.setSource(blankToNull(request.getSource()));
    customer.setStatus(normalizeStatusOrDefault(request.getStatus()));
    customer.setNote(blankToNull(request.getNote()));
    customer.setBranch(newBranch);
    customer.setAssignedUser(assignedUser);

    Customer saved = customerRepository.save(customer);
    syncTags(saved, workspace, request.getTagIds());

    if (!oldBranch.getId().equals(newBranch.getId())) {
      log(saved, requester, "MOVE_BRANCH",
          "Chuyển chi nhánh từ " + oldBranch.getName() + " sang " + newBranch.getName());
    } else {
      log(saved, requester, "UPDATE", "Cập nhật khách hàng");
    }

    return CustomerResponse.from(findCustomerOrThrow(saved.getId(), workspace.getId()));
  }

  @Override
  @Transactional(readOnly = true)
  public List<CustomerTagResponse> getTags(Long workspaceId, String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    resolveAccessScope(workspace, findUserOrThrow(requesterEmail));
    return tagRepository.findAllByWorkspaceIdOrderByNameAsc(workspace.getId())
        .stream().map(CustomerTagResponse::from).toList();
  }

  @Override
  @Transactional
  public CustomerTagResponse createTag(Long workspaceId, CustomerTagRequest request, String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    resolveAccessScope(workspace, findUserOrThrow(requesterEmail));

    String name = request.getName().trim();
    tagRepository.findByWorkspaceIdAndNameIgnoreCase(workspace.getId(), name)
        .ifPresent(tag -> {
          throw AppException.conflict("Tag đã tồn tại");
        });

    CustomerTag tag = CustomerTag.builder()
        .workspace(workspace)
        .name(name)
        .color(request.getColor() == null || request.getColor().isBlank() ? "#64748b" : request.getColor())
        .build();
    return CustomerTagResponse.from(tagRepository.save(tag));
  }

  @Override
  @Transactional
  public CustomerTagResponse updateTag(Long workspaceId, Long tagId, CustomerTagRequest request,
      String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    resolveAccessScope(workspace, findUserOrThrow(requesterEmail));

    CustomerTag tag = tagRepository.findById(tagId)
        .filter(item -> item.getWorkspace().getId().equals(workspace.getId()))
        .orElseThrow(() -> AppException.notFound("Không tìm thấy tag"));

    String name = request.getName().trim();
    tagRepository.findByWorkspaceIdAndNameIgnoreCase(workspace.getId(), name)
        .filter(existing -> !existing.getId().equals(tagId))
        .ifPresent(existing -> {
          throw AppException.conflict("Tag đã tồn tại");
        });

    tag.setName(name);
    tag.setColor(request.getColor() == null || request.getColor().isBlank() ? "#64748b" : request.getColor());
    return CustomerTagResponse.from(tagRepository.save(tag));
  }

  @Override
  @Transactional
  public void deleteTag(Long workspaceId, Long tagId, String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    resolveAccessScope(workspace, findUserOrThrow(requesterEmail));

    CustomerTag tag = tagRepository.findById(tagId)
        .filter(item -> item.getWorkspace().getId().equals(workspace.getId()))
        .orElseThrow(() -> AppException.notFound("Không tìm thấy tag"));

    tagAssignmentRepository.deleteAllByTagId(tag.getId());
    tagRepository.delete(tag);
  }

  @Override
  @Transactional(readOnly = true)
  public List<CustomerActivityResponse> getActivities(Long workspaceId, Long customerId, String requesterEmail) {
    Workspace workspace = findWorkspaceRootOrThrow(workspaceId);
    User requester = findUserOrThrow(requesterEmail);
    Customer customer = findCustomerOrThrow(customerId, workspace.getId());
    assertCanAccessCustomer(workspace, requester, customer);
    return activityRepository.findAllByCustomerIdOrderByCreatedAtDesc(customerId)
        .stream().map(CustomerActivityResponse::from).toList();
  }

  private void syncTags(Customer customer, Workspace workspace, List<Long> tagIds) {
    Set<Long> requestedIds = tagIds == null
        ? Set.of()
        : new LinkedHashSet<>(tagIds.stream().filter(Objects::nonNull).toList());

    if (requestedIds.isEmpty()) {
      customer.getTagAssignments().clear();
      return;
    }

    List<CustomerTag> tags = tagRepository.findAllByWorkspaceIdAndIdIn(workspace.getId(), requestedIds);
    if (tags.size() != requestedIds.size()) {
      throw AppException.badRequest("Danh sách tag không hợp lệ");
    }

    customer.getTagAssignments().removeIf(assignment -> !requestedIds.contains(assignment.getTag().getId()));
    Set<Long> existingIds = customer.getTagAssignments().stream()
        .map(assignment -> assignment.getTag().getId())
        .collect(java.util.stream.Collectors.toSet());

    List<CustomerTagAssignment> newAssignments = tags.stream()
        .filter(tag -> !existingIds.contains(tag.getId()))
        .map(tag -> CustomerTagAssignment.builder()
            .customer(customer)
            .tag(tag)
            .build())
        .toList();
    customer.getTagAssignments().addAll(tagAssignmentRepository.saveAll(newAssignments));
  }

  private void log(Customer customer, User actor, String action, String description) {
    activityRepository.save(CustomerActivity.builder()
        .customer(customer)
        .actor(actor)
        .action(action)
        .description(description)
        .build());
  }

  private void assertCanAccessCustomer(Workspace workspace, User user, Customer customer) {
    AccessScope scope = resolveAccessScope(workspace, user);
    if (scope.canSeeAll()) {
      return;
    }
    if (!scope.branchIds().contains(customer.getBranch().getId())) {
      throw AppException.forbidden("Bạn không có quyền thao tác với khách hàng này");
    }
  }

  private List<Customer> searchByScope(AccessibleCustomerScope scope, Long workspaceId, Long branchId, String status,
      Long tagId, String search) {
    boolean hasWorkspaces = !scope.workspaceIds().isEmpty();
    boolean hasBranches = !scope.branchIds().isEmpty();

    if (hasWorkspaces && hasBranches) {
      return customerRepository.searchCustomersInWorkspacesOrBranches(scope.workspaceIds(), scope.branchIds(),
          workspaceId, branchId, status, tagId, search);
    }
    if (hasWorkspaces) {
      return customerRepository.searchCustomersInWorkspaces(scope.workspaceIds(), workspaceId, branchId, status,
          tagId, search);
    }
    if (hasBranches) {
      return customerRepository.searchCustomersInBranches(scope.branchIds(), workspaceId, branchId, status, tagId,
          search);
    }
    return List.of();
  }

  private AccessibleCustomerScope resolveAccessibleCustomerScope(User user) {
    Set<Long> workspaceIds = new LinkedHashSet<>();
    Set<Long> branchIds = new LinkedHashSet<>();

    for (WorkspaceMember member : memberRepository.findAllByUserIdAndIsActiveTrue(user.getId())) {
      Workspace workspace = member.getWorkspace();
      String role = member.getRole().getCode();

      if (workspace.getLevel() == 0 && ("OWNER".equals(role) || "ADMIN".equals(role))) {
        workspaceIds.add(workspace.getId());
        continue;
      }

      if (workspace.getLevel() == 1 && workspace.getParent() != null) {
        branchIds.add(workspace.getId());
      }
    }

    branchIds.removeIf(branchId -> {
      Workspace branch = workspaceRepository.findById(branchId).orElse(null);
      return branch != null && branch.getParent() != null && workspaceIds.contains(branch.getParent().getId());
    });

    return new AccessibleCustomerScope(workspaceIds, branchIds);
  }

  private void assertCanUseGlobalFilters(AccessibleCustomerScope scope, Long workspaceId, Long branchId) {
    if (workspaceId != null && !scope.workspaceIds().contains(workspaceId)) {
      boolean hasBranchInWorkspace = scope.branchIds().stream()
          .map(id -> workspaceRepository.findById(id).orElse(null))
          .filter(Objects::nonNull)
          .anyMatch(branch -> branch.getParent() != null && branch.getParent().getId().equals(workspaceId));
      if (!hasBranchInWorkspace) {
        throw AppException.forbidden("Bạn không có quyền xem workspace này");
      }
    }

    if (branchId != null && !scope.branchIds().contains(branchId)) {
      Workspace branch = workspaceRepository.findById(branchId)
          .orElseThrow(() -> AppException.notFound("Không tìm thấy chi nhánh"));
      if (branch.getParent() == null || !scope.workspaceIds().contains(branch.getParent().getId())) {
        throw AppException.forbidden("Bạn không có quyền xem chi nhánh này");
      }
    }
  }

  private AccessScope resolveAccessScope(Workspace workspace, User user) {
    if (user.isSuperAdmin()) {
      return new AccessScope(true, Set.of());
    }

    Optional<WorkspaceMember> parentMember = memberRepository.findByWorkspaceIdAndUserId(workspace.getId(), user.getId())
        .filter(WorkspaceMember::getIsActive);
    if (parentMember.isPresent()) {
      String role = parentMember.get().getRole().getCode();
      if ("OWNER".equals(role) || "ADMIN".equals(role)) {
        return new AccessScope(true, Set.of());
      }
    }

    Set<Long> branchIds = new LinkedHashSet<>();
    for (WorkspaceMember member : memberRepository.findAllByUserIdAndIsActiveTrue(user.getId())) {
      Workspace memberWorkspace = member.getWorkspace();
      if (memberWorkspace.getLevel() == 1
          && memberWorkspace.getParent() != null
          && memberWorkspace.getParent().getId().equals(workspace.getId())) {
        branchIds.add(memberWorkspace.getId());
      }
    }

    if (branchIds.isEmpty()) {
        throw AppException.forbidden("Bạn không có quyền truy cập workspace này");
    }
    return new AccessScope(false, branchIds);
  }

  private Workspace findWorkspaceRootOrThrow(Long workspaceId) {
    Workspace workspace = workspaceRepository.findById(workspaceId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy workspace"));
    if (workspace.getLevel() != 0) {
      throw AppException.badRequest("workspaceId phải là workspace tổng");
    }
    return workspace;
  }

  private Workspace findBranchInWorkspace(Workspace workspace, Long branchId) {
    Workspace branch = workspaceRepository.findById(branchId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy chi nhánh"));
    if (branch.getLevel() != 1 || branch.getParent() == null || !branch.getParent().getId().equals(workspace.getId())) {
      throw AppException.badRequest("Chi nhánh không thuộc workspace này");
    }
    return branch;
  }

  private Customer findCustomerOrThrow(Long customerId, Long workspaceId) {
    Customer customer = customerRepository.findDetailById(customerId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy khách hàng"));
    if (!customer.getWorkspace().getId().equals(workspaceId)) {
      throw AppException.notFound("Khách hàng không thuộc workspace này");
    }
    return customer;
  }

  private User findAssignedUser(Workspace workspace, Long userId) {
    if (userId == null) {
      return null;
    }
    User user = userRepository.findById(userId)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy người phụ trách"));
    boolean inWorkspace = memberRepository.findAllByUserIdAndIsActiveTrue(userId).stream()
        .anyMatch(member -> {
          Workspace memberWorkspace = member.getWorkspace();
          return memberWorkspace.getId().equals(workspace.getId())
              || (memberWorkspace.getParent() != null && memberWorkspace.getParent().getId().equals(workspace.getId()));
        });
    if (!inWorkspace) {
      throw AppException.badRequest("Người phụ trách không thuộc workspace này");
    }
    return user;
  }

  private User findUserOrThrow(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> AppException.notFound("Không tìm thấy user"));
  }

  private String normalizeStatus(String status) {
    String value = blankToNull(status);
    if (value == null) {
      return null;
    }
    value = value.toUpperCase(Locale.ROOT);
    if (!VALID_STATUSES.contains(value)) {
      throw AppException.badRequest("Trạng thái không hợp lệ");
    }
    return value;
  }

  private String normalizeStatusOrDefault(String status) {
    String value = normalizeStatus(status);
    return value == null ? "NEW" : value;
  }

  private String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.trim();
  }

  private record AccessScope(boolean canSeeAll, Set<Long> branchIds) {
  }

  private record AccessibleCustomerScope(Set<Long> workspaceIds, Set<Long> branchIds) {
  }
}
