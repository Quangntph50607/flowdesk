package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CustomerRequest {

  @NotBlank
  @Size(max = 150)
  private String name;

  @NotBlank
  @Size(max = 40)
  @Pattern(regexp = "^$|^(0|\\+84|84)(3|5|7|8|9)\\d{8}$", message = "Số điện thoại chưa đúng định dạng")
  private String phone;

  @Email(message = "Email chưa đúng định dạng")
  @Size(max = 255)
  private String email;

  @Size(max = 500)
  private String address;

  @Size(max = 80)
  private String source;

  @Size(max = 50)
  private String status;

  @Size(max = 1000)
  private String note;

  @NotNull
  private Long branchId;

  private Long assignedUserId;

  private List<Long> tagIds;
}
