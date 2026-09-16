package com.example.flowdesk_be.controller;

import com.example.flowdesk_be.dto.response.ApiResponse;
import com.example.flowdesk_be.dto.response.UploadResponse;
import com.example.flowdesk_be.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "File Upload")
public class FileUploadController {

  private final StorageService storageService;

  /**
   * Upload ảnh đại diện / ảnh workspace.
   * Folder: "avatars"
   */
  @Operation(summary = "Upload ảnh đại diện hoặc ảnh workspace")
  @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<UploadResponse>> uploadAvatar(
      @RequestPart("file") MultipartFile file,
      @AuthenticationPrincipal UserDetails ud) {

    String url = storageService.upload(file, "avatars");
    return ResponseEntity.ok(ApiResponse.success(200, "Upload thành công",
        buildResponse(file, url)));
  }

  /**
   * Upload file/ảnh trong chat.
   * Folder: "chat"
   */
  @Operation(summary = "Upload file hoặc ảnh trong chat")
  @PostMapping(value = "/chat", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<UploadResponse>> uploadChatFile(
      @RequestPart("file") MultipartFile file,
      @AuthenticationPrincipal UserDetails ud) {

    String url = storageService.upload(file, "chat");
    return ResponseEntity.ok(ApiResponse.success(200, "Upload thành công",
        buildResponse(file, url)));
  }

  // ── Helper ───────────────────────────────────────────────────────────────

  /**
   * Lấy presigned URL để xem/tải file từ bucket private.
   * Truyền fileKey = phần path trong bucket (vd: "chat/uuid.png")
   */
  @Operation(summary = "Lấy presigned URL để xem file (bucket private)")
  @GetMapping("/presign")
  public ResponseEntity<ApiResponse<String>> presign(
      @RequestParam String key,
      @AuthenticationPrincipal UserDetails ud) {
    String url = storageService.generatePresignedUrl(key);
    return ResponseEntity.ok(ApiResponse.success(200, "OK", url));
  }

  private UploadResponse buildResponse(MultipartFile file, String url) {
    return UploadResponse.builder()
        .fileUrl(url)
        .fileName(file.getOriginalFilename())
        .fileType(file.getContentType())
        .fileSize(file.getSize())
        .build();
  }
}
