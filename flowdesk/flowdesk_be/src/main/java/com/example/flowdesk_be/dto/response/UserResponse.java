package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.User;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class UserResponse {

  private Long id;
  private String email;
  private String fullName;
  private String avatarUrl;
  private String systemRole;
  private Boolean isActive;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  // Workspace memberships — trả về khi cần (e.g. /api/me)
  private List<AuthResponse.WorkspaceInfo> workspaces;

  public static UserResponse from(User user) {
    UserResponse r = new UserResponse();
    r.id = user.getId();
    r.email = user.getEmail();
    r.fullName = user.getFullName();
    r.avatarUrl = user.getAvatarUrl();
    r.systemRole = user.getSystemRole();
    r.isActive = user.getIsActive();
    r.createdAt = user.getCreatedAt();
    r.updatedAt = user.getUpdatedAt();
    return r;
  }

  // Kèm workspace info (dùng cho /api/me)
  public static UserResponse fromWithWorkspaces(User user) {
    UserResponse r = from(user);
    r.workspaces = user.getWorkspaceMemberships()
        .stream()
        .filter(m -> m.getIsActive())
        .map(m -> new AuthResponse.WorkspaceInfo(
            m.getWorkspace().getId(),
            m.getWorkspace().getName(),
            m.getWorkspace().getSlug(),
            m.getWorkspace().getParent() != null ? m.getWorkspace().getParent().getId() : null,
            m.getRole().getCode()))
        .toList();
    return r;
  }
}
