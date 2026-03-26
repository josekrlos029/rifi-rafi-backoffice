import axios from "axios";
import { useAuthStore } from "./auth-store";
import { extractAuthContextFromToken, isBackofficeRole } from "./auth-token";

const apiClient = axios.create({
  baseURL: "https://api.rifirafi.com",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const clearSession = () => {
      useAuthStore.getState().clearTokens();
      if (typeof window !== "undefined") {
        document.cookie = "rifi-auth-token=; path=/; max-age=0";
        window.location.href = "/login";
      }
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            "https://api.rifirafi.com/auth/refresh",
            { refresh_token: refreshToken }
          );
          const context = extractAuthContextFromToken(data.access_token);
          if (!isBackofficeRole(context.role)) {
            clearSession();
            return Promise.reject(error);
          }
          useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
          document.cookie = `rifi-auth-token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(originalRequest);
        } catch {
          clearSession();
          return Promise.reject(error);
        }
      }

      clearSession();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
