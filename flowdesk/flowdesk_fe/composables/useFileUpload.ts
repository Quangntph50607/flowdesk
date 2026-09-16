/**
 * Composable xu ly upload file len Backblaze B2 qua REST API.
 * Tra ve URL sau khi upload thanh cong.
 */
export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface ApiUploadResponse {
  data: UploadResult;
  message?: string;
}

export const useFileUpload = () => {
  const config = useRuntimeConfig();
  const token = useCookie("access_token");

  const uploading = ref(false);
  const uploadProgress = ref(0);

  /**
   * Upload file chat len /api/upload/chat.
   * @returns UploadResult hoac null neu that bai
   */
  async function uploadChatFile(file: File): Promise<UploadResult | null> {
    uploading.value = true;
    uploadProgress.value = 0;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const json = await uploadWithProgress(
        `${config.public.apiBase}/api/upload/chat`,
        formData,
      );
      uploadProgress.value = 100;
      return json.data;
    } catch (e: any) {
      console.error("[upload] error:", e?.message);
      return null;
    } finally {
      uploading.value = false;
    }
  }

  /**
   * Upload avatar len /api/upload/avatar.
   */
  async function uploadAvatar(file: File): Promise<UploadResult | null> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${config.public.apiBase}/api/upload/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.value ?? ""}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload thất bại (${res.status})`);
      const json = await res.json();
      return json.data as UploadResult;
    } catch (e: any) {
      console.error("[upload avatar] error:", e?.message);
      return null;
    }
  }

  function uploadWithProgress(
    url: string,
    formData: FormData,
  ): Promise<ApiUploadResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${token.value ?? ""}`);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        uploadProgress.value = Math.min(
          99,
          Math.round((event.loaded / event.total) * 100),
        );
      };

      xhr.onload = () => {
        const json = parseJsonResponse(xhr.responseText);
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(json?.message ?? `Upload thất bại (${xhr.status})`));
          return;
        }
        resolve(json as ApiUploadResponse);
      };

      xhr.onerror = () => reject(new Error("Không thể kết nối máy chủ upload"));
      xhr.onabort = () => reject(new Error("Upload đã bị hủy"));
      xhr.send(formData);
    });
  }

  function parseJsonResponse(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  return { uploading, uploadProgress, uploadChatFile, uploadAvatar };
};
