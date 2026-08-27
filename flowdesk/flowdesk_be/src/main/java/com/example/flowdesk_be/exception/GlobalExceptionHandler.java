package com.example.flowdesk_be.exception;

import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice // (1)
public class GlobalExceptionHandler {

  // (2) Lỗi validation — @Valid fail
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
      MethodArgumentNotValidException ex) {

    Map<String, String> errors = new HashMap<>();

    ex.getBindingResult().getAllErrors().forEach(error -> {
      String field = ((FieldError) error).getField();
      String message = error.getDefaultMessage();
      errors.put(field, message);
    });

    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(400, "Dữ liệu không hợp lệ"));
  }

  // (3) Sai email hoặc password khi login
  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiResponse<Void>> handleBadCredentials(
      BadCredentialsException ex) {

    return ResponseEntity
        .status(HttpStatus.UNAUTHORIZED)
        .body(ApiResponse.error(401, "Email hoặc mật khẩu không đúng"));
  }

  // (4) Tài khoản bị khoá (is_active = false)
  @ExceptionHandler(DisabledException.class)
  public ResponseEntity<ApiResponse<Void>> handleDisabled(
      DisabledException ex) {

    return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(ApiResponse.error(403, "Tài khoản đã bị khoá"));
  }

  // (5) Lỗi nghiệp vụ có HTTP status cụ thể
  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
    return ResponseEntity
        .status(ex.getStatus())
        .body(ApiResponse.error(ex.getStatus().value(), ex.getMessage()));
  }

  // (6) Lỗi nghiệp vụ chung — throw new RuntimeException(...)
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiResponse<Void>> handleRuntimeException(
      RuntimeException ex) {

    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(400, ex.getMessage()));
  }

  // (6) Catch-all — lỗi không mong muốn
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleGenericException(
      Exception ex) {

    return ResponseEntity
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(500, "Đã xảy ra lỗi hệ thống"));
  }
}
