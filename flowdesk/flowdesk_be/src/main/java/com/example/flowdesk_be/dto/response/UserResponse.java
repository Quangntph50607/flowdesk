package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.User;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

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
}
