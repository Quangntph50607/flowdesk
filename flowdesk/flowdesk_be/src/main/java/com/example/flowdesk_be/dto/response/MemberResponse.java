package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.WorkspaceMember;
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
    return r;
  }
}
