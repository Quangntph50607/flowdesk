package com.example.flowdesk_be.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

  /**
   * Upload file lên Backblaze B2.
   *
   * @param file   file cần upload
   * @param folder thư mục con trong bucket (vd: "avatars", "chat")
   * @return URL công khai của file đã upload
   */
  String upload(MultipartFile file, String folder);

  /**
   * Xóa file khỏi bucket theo key (path trong bucket).
   */
  void delete(String fileKey);

  /**
   * Tạo presigned URL để xem/tải file từ bucket private.
   * URL có hiệu lực trong 1 giờ.
   */
  String generatePresignedUrl(String fileKey);
}
