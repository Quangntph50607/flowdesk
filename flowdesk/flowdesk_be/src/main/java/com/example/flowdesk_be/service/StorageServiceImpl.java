package com.example.flowdesk_be.service;

import com.example.flowdesk_be.exception.AppException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageServiceImpl implements StorageService {

  private final S3Client s3Client;
  private final S3Presigner s3Presigner;

  @Value("${app.storage.b2.bucket-name}")
  private String bucketName;

  @Value("${app.storage.b2.endpoint}")
  private String endpoint;

  private static final long MAX_FILE_SIZE = 30 * 1024 * 1024L; // mặc định, video có thể override

  private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "video/mp4", "video/webm",
      "audio/mpeg", "audio/ogg", "audio/wav",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/zip", "application/x-rar-compressed",
      "text/plain", "text/csv");

  @Override
  public String upload(MultipartFile file, String folder) {
    validateFile(file);

    String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
    String extension = extractExtension(originalName);
    String key = folder + "/" + UUID.randomUUID() + extension;

    try {
      PutObjectRequest request = PutObjectRequest.builder()
          .bucket(bucketName)
          .key(key)
          .contentType(file.getContentType())
          .contentLength(file.getSize())
          .metadata(Map.of("original-name", sanitizeMetadata(originalName)))
          .build();

      s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

      // Trả về full URL — nếu bucket Public thì dùng trực tiếp;
      // nếu Private thì FE cần gọi /api/upload/presign để lấy signed URL
      String fileUrl = endpoint + "/" + bucketName + "/" + key;
      log.info("Uploaded to B2, key={}", key);
      return fileUrl;

    } catch (IOException e) {
      log.error("Failed to read file bytes", e);
      throw AppException.badRequest("Không thể đọc file");
    } catch (Exception e) {
      log.error("Upload failed: {}", e.getMessage(), e);
      throw new RuntimeException("Upload file thất bại: " + e.getMessage(), e);
    }
  }

  @Override
  public void delete(String fileKey) {
    try {
      s3Client.deleteObject(DeleteObjectRequest.builder()
          .bucket(bucketName)
          .key(fileKey)
          .build());
      log.info("Deleted from B2: {}", fileKey);
    } catch (Exception e) {
      log.error("Delete failed: {}", e.getMessage(), e);
      throw new RuntimeException("Xóa file thất bại: " + e.getMessage(), e);
    }
  }

  @Override
  public String generatePresignedUrl(String fileKey) {
    try {
      GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
          .signatureDuration(Duration.ofHours(1))
          .getObjectRequest(GetObjectRequest.builder()
              .bucket(bucketName)
              .key(fileKey)
              .build())
          .build();

      return s3Presigner.presignGetObject(presignRequest).url().toString();
    } catch (Exception e) {
      log.error("Presign failed for key {}: {}", fileKey, e.getMessage());
      throw new RuntimeException("Không thể tạo URL truy cập file", e);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty())
      throw AppException.badRequest("File không được rỗng");

    String ct = file.getContentType();
    if (ct == null || !ALLOWED_MIME_TYPES.contains(ct))
      throw AppException.badRequest("Loại file không được hỗ trợ: " + ct);

    // Video cho phép đến 30MB, các loại khác 30MB
    long limit = ct.startsWith("video/") ? 30 * 1024 * 1024L : 30 * 1024 * 1024L;
    if (file.getSize() > limit) {
      String label = ct.startsWith("video/") ? "30MB" : "30MB";
      throw AppException.badRequest("File vượt quá giới hạn " + label);
    }
  }

  private String extractExtension(String filename) {
    int i = filename.lastIndexOf('.');
    return i >= 0 ? filename.substring(i) : "";
  }

  private String sanitizeMetadata(String value) {
    return value.replaceAll("[^a-zA-Z0-9._ -]", "_");
  }
}
