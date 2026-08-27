package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddMemberRequest {

  @NotNull(message = "userId không được để trống")
  private Long userId;

  @NotNull(message = "roleCode không được để trống")
  @Pattern(regexp = "^(ADMIN|AGENT)$", message = "roleCode phải là ADMIN hoặc AGENT")
  private String roleCode;
}
