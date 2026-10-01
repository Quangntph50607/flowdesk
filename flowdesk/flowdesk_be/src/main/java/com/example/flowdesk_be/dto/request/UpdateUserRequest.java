package com.example.flowdesk_be.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateUserRequest {

    @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
    private String fullName;

    @Size(max = 500, message = "URL avatar tối da 500 ký tự")
    private String avatarUrl;

    @Size(max = 11, message = "Số điện thoại tối đa 11 ký tự")
    private String phone;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    private LocalDate dateOfBirth;
}
