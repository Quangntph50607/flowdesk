package com.example.flowdesk_be.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ApiResponse<T> {

  private int status;
  private boolean success;
  private String message;
  private T data;

  // Thành công
  public static <T> ApiResponse<T> success(int status, String message, T data) {
    return new ApiResponse<>(status, true, message, data);
  }

  // Lỗi
  public static <T> ApiResponse<T> error(int status, String message) {
    return new ApiResponse<>(status, false, message, null);
  }

}
