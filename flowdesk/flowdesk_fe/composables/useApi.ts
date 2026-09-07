import axios from "axios";

export const useApi = () => {
  const config = useRuntimeConfig();

  const api = axios.create({
    baseURL: config.public.apiBase as string,
    headers: { "Content-Type": "application/json" },
  });

  // Đính kèm access token vào mọi request
  api.interceptors.request.use((req) => {
    const token = useCookie("access_token");
    if (token.value) {
      req.headers.Authorization = `Bearer ${token.value}`;
    }
    return req;
  });

  // Tự refresh token khi 401
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = useCookie("refresh_token");
        if (refreshToken.value) {
          try {
            const res = await axios.post(
              `${config.public.apiBase}/api/auth/refresh`,
              { refreshToken: refreshToken.value },
            );
            const newAccessToken = res.data.data.accessToken;
            const newRefreshToken = res.data.data.refreshToken;
            useCookie("access_token", { maxAge: 60 * 60 }).value =
              newAccessToken;
            useCookie("refresh_token", { maxAge: 60 * 60 * 24 * 7 }).value =
              newRefreshToken;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch {
            useAuthStore().logout();
          }
        } else {
          useAuthStore().logout();
        }
      }
      return Promise.reject(error);
    },
  );

  return api;
};
