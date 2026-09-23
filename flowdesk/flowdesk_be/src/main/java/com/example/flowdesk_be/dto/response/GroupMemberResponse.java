package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.ChatRoomMember;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroupMemberResponse {

  private Long userId;
  private String fullName;
  private String email;
  private String avatarInitial;
  private boolean isOwner;

  public static GroupMemberResponse from(ChatRoomMember m) {
    String name = m.getUser().getFullName();
    return GroupMemberResponse.builder()
        .userId(m.getUser().getId())
        .fullName(name)
        .email(m.getUser().getEmail())
        .avatarInitial(name != null && !name.isEmpty()
            ? String.valueOf(name.charAt(0)).toUpperCase()
            : "?")
        .isOwner(Boolean.TRUE.equals(m.getIsOwner()))
        .build();
  }
}
