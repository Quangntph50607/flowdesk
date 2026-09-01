package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateWorkspaceRequest {

  @NotBlank(message = "Tên workspace không được để trống")
  @Size(max = 150, message = "Tên workspace tối đa 150 ký tự")
  private String name;

  @NotBlank(message = "Slug không được để trống")
  @Size(max = 150, message = "Slug tối đa 150 ký tự")
  @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug chỉ gồm chữ thường, số và dấu gạch ngang (vd: spa-abc)")
  private String slug;

  // SUPER_ADMIN chỉ định ai là OWNER của workspace này
  // Nếu null → người gọi API (requester) sẽ là owner (dùng khi OWNER tự tạo chi
  // nhánh)
  @Email(message = "ownerEmail không hợp lệ")
  private String ownerEmail;
}
