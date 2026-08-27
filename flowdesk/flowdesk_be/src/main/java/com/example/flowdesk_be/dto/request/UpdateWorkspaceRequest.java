package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateWorkspaceRequest {

  @Size(max = 150, message = "Tên workspace tối đa 150 ký tự")
  private String name;
}
