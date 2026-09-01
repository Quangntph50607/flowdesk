package com.example.flowdesk_be.exception;

import com.example.flowdesk_be.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

  // Lỗi nghiệp vụ (AppException)
  @ExceptionHandler(AppException.class)
  public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
    return ResponseEntity
        .status(ex.getStatus())
        .body(ApiResponse.error(ex.getStatus().value(), ex.getMessage()));
  }

  // Lỗi validation (@Valid)
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors()
        .stream()
        .map(FieldError::getDefaultMessage)
        .collect(Collectors.joining(", "));
    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(400, message));
  }

  // Lỗi không xác định
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
    return ResponseEntity
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error(500, "Lỗi hệ thống: " + ex.getMessage()));
  }
}
