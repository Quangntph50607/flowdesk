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

  private String accessToken; // JWT — sống 24h
  private String refreshToken; // UUID — sống 7 ngày
  private String tokenType; // "Bearer"
  private Long userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private String systemRole; // "SUPER_ADMIN" | null

  // Danh sách workspace user đang là thành viên (active)
  private List<WorkspaceInfo> workspaces;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WorkspaceInfo {
    private Long workspaceId;
    private String workspaceName;
    private String workspaceSlug;
    private Long parentId; // null = workspace tổng, non-null = chi nhánh
    private String roleCode; // 'OWNER' | 'ADMIN' | 'AGENT'
  }
}
