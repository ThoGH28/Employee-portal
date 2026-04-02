import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../../config";
import {
  getTokenFromStorage,
  getRefreshTokenFromStorage,
  removeTokenFromStorage,
  setTokenToStorage,
} from "../utils/storage";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = getTokenFromStorage();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        const status = error.response?.status;

        // Handle 401 or 403 — attempt token refresh once
        if ((status === 401 || status === 403) && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = getRefreshTokenFromStorage();
          if (!refreshToken) {
            removeTokenFromStorage();
            window.location.href = "/login";
            return Promise.reject(error);
          }

          if (isRefreshing) {
            // Queue this request until refresh finishes
            return new Promise<string>((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          isRefreshing = true;
          try {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
              refresh: refreshToken,
            });
            const newAccessToken: string = res.data.access;
            setTokenToStorage(newAccessToken);
            this.client.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            removeTokenFromStorage();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  setToken(token: string): void {
    setTokenToStorage(token);
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  clearToken(): void {
    removeTokenFromStorage();
    delete this.client.defaults.headers.Authorization;
  }
}

export const apiClient = new ApiClient();
export default apiClient.getClient();
