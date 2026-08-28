package com.example.flowdesk_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class AuthResponse {

  private String accessToken; // JWT — sống ngắn (24h)
  private String refreshToken; // UUID — sống dài (7 ngày)
  private String tokenType; // "Bearer"
  private Long userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private String systemRole; // "SUPER_ADMIN" hoặc null

  // Danh sách workspace user thuộc về (kèm role trong workspace đó)
  private List<WorkspaceInfo> workspaces;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WorkspaceInfo {
    private Long workspaceId;
    private String workspaceName;
    private String workspaceSlug;
    private Long parentId; // null = workspace cha, non-null = chi nhánh
    private String roleCode; // "ADMIN" | "AGENT"
  }
}
