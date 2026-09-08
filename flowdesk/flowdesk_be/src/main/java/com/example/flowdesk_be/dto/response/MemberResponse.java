package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.WorkspaceMember;
import com.example.flowdesk_be.entity.Workspace;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MemberResponse {

  private Long id;
  private Long userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private String roleCode; // 'OWNER' | 'ADMIN' | 'AGENT'
  private String roleName;
  private Long workspaceId;
  private String workspaceName;
  private Long branchId; // null nếu là member của workspace tổng
  private String branchName; // null nếu là member của workspace tổng
  private Boolean isActive;
  private LocalDateTime joinedAt;

  public static MemberResponse from(WorkspaceMember wm) {
    MemberResponse r = new MemberResponse();
    r.id = wm.getId();
    r.userId = wm.getUser().getId();
    r.email = wm.getUser().getEmail();
    r.fullName = wm.getUser().getFullName();
    r.avatarUrl = wm.getUser().getAvatarUrl();
    r.roleCode = wm.getRole().getCode();
    r.roleName = wm.getRole().getName();
    r.workspaceId = wm.getWorkspace().getId();
    r.workspaceName = wm.getWorkspace().getName();
    r.isActive = wm.getIsActive();
    r.joinedAt = wm.getJoinedAt();

    Workspace ws = wm.getWorkspace();
    if (ws.getLevel() == 1 && ws.getParent() != null) {
      // member thuộc chi nhánh
      r.branchId = ws.getId();
      r.branchName = ws.getName();
    }
    // branchId / branchName = null → member thuộc workspace tổng
    return r;
  }
}
