package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerTagRequest {

  @NotBlank
  @Size(max = 80)
  private String name;

  @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Màu tag phải có dạng #RRGGBB")
  private String color;
}
