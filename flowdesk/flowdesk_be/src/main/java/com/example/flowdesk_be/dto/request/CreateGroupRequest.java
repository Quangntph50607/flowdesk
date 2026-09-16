package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class CreateGroupRequest {
    @NotBlank(message = "Tên nhóm không được để trống")
    private String name;

    @NotEmpty(message = "Phải chọn ít nhất 1 thành viên")
    private List<Long> memberIds;
}
