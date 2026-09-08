package com.example.flowdesk_be.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * Đại diện cho 1 user trong bảng thành viên — gom toàn bộ membership của user
 * đó.
 * Dùng cho endpoint GET /api/workspaces/{id}/all-members
 */
@Getter
@Setter
public class MemberGroupResponse {

  private Long userId;
  private String email;
  private String fullName;
  private String avatarUrl;

  // Role của membership workspace tổng (OWNER/ADMIN/AGENT)
  private String roleCode;
  private String roleName;

  // Trạng thái membership workspace tổng (null nếu user chỉ có trong chi nhánh)
  private Boolean accountActive;

  // id của WorkspaceMember record tại workspace tổng (dùng để toggle account)
  private Long workspaceMemberId;
  private Long workspaceId;

  // "Chi nhánh A, Chi nhánh B +1..." — tính sẵn ở BE
  private String branchLabels;

  // Toàn bộ membership (workspace tổng + chi nhánh) — dùng cho dialog chi tiết
  private List<MemberResponse> memberships;
}
