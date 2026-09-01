package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.Workspace;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class WorkspaceResponse {

  private Long id;
  private String name;
  private String slug;
  private Long ownerId;
  private String ownerName;
  private Long parentId; // null = workspace tổng, non-null = chi nhánh
  private Integer level; // 0 = tổng, 1 = chi nhánh
  private Boolean isActive;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  // Chỉ populate khi fetch workspace tổng kèm chi nhánh
  private List<WorkspaceResponse> children;

  public static WorkspaceResponse from(Workspace ws) {
    WorkspaceResponse r = new WorkspaceResponse();
    r.id = ws.getId();
    r.name = ws.getName();
    r.slug = ws.getSlug();
    r.ownerId = ws.getOwner() != null ? ws.getOwner().getId() : null;
    r.ownerName = ws.getOwner() != null ? ws.getOwner().getFullName() : null;
    r.parentId = ws.getParent() != null ? ws.getParent().getId() : null;
    r.level = ws.getLevel();
    r.isActive = ws.getIsActive();
    r.createdAt = ws.getCreatedAt();
    r.updatedAt = ws.getUpdatedAt();
    return r;
  }
}
