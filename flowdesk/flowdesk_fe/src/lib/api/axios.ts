import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Lấy accessToken — ưu tiên từ store (đã hydrate), fallback sang localStorage
function getAccessToken(): string | null {
  // Thử store trước (đã hydrate)
  const fromStore = useAuthStore.getState().accessToken;
  if (fromStore) return fromStore;

  // Fallback: đọc thẳng từ localStorage khi store chưa hydrate
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("flowdesk-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.state?.accessToken ?? null;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

// Đính kèm access token vào mỗi request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động refresh khi nhận 401, logout khi nhận 403 trên admin endpoints
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // 401 → thử refresh token
    if (status === 401 && !original._retry) {
      original._retry = true;

      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = data.data;
        setTokens(accessToken, newRefresh);

        // Cập nhật cookie
        if (typeof window !== "undefined") {
          document.cookie = `flowdesk-token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        }

        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // 403 → token hết hạn hoặc không đúng role, thử refresh một lần
    if (status === 403 && !original._retry403) {
      original._retry403 = true;

      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefresh } = data.data;
          setTokens(accessToken, newRefresh);

          if (typeof window !== "undefined") {
            document.cookie = `flowdesk-token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          }

          original.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(original);
        } catch {
          clearAuth();
          if (typeof window !== "undefined") window.location.href = "/login";
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  },
);
