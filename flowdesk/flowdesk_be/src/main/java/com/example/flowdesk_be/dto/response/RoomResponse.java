package com.example.flowdesk_be.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class RoomResponse {
    private Long id;
    private String type;           // "DIRECT" | "GROUP"
    private String name;           // tên group, hoặc fullName của người kia (DIRECT)
    private String avatarInitial;  // ký tự đầu để hiển thị avatar
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private int unreadCount;
    private boolean isOwner;       // current user có phải owner không (GROUP)
}
