package com.example.flowdesk_be.dto.response;

import com.example.flowdesk_be.entity.ChatRoomMember;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class GroupMemberResponse {

  private Long userId;
  private String fullName;
  private String email;
  private String avatarInitial;
  private String avatarUrl;
  private boolean isOwner;
  private boolean isMuted;
  private boolean isPinned;

  public static GroupMemberResponse from(ChatRoomMember m) {
    String name = m.getUser().getFullName();
    return GroupMemberResponse.builder()
        .userId(m.getUser().getId())
        .fullName(name)
        .email(m.getUser().getEmail())
        .avatarInitial(name != null && !name.isEmpty()
            ? String.valueOf(name.charAt(0)).toUpperCase()
            : "?")
        .avatarUrl(m.getUser().getAvatarUrl())
        .isOwner(Boolean.TRUE.equals(m.getIsOwner()))
        .isMuted(Boolean.TRUE.equals(m.getIsMuted()))
        .isPinned(Boolean.TRUE.equals(m.getIsPinned()))
        .build();
  }
}
