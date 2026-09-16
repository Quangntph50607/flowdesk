package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpenDirectRequest {
    @NotNull(message = "targetUserId không được để trống")
    private Long targetUserId;
}

