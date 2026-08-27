package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {

  @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
  private String fullName;

  @Size(max = 500, message = "Avatar URL tối đa 500 ký tự")
  private String avatarUrl;
}
