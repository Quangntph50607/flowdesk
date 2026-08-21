import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Đính kèm access token vào mỗi request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động refresh khi nhận 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefresh } = data.data;
        setTokens(accessToken, newRefresh);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        clearAuth();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
