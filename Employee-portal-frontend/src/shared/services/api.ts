import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../../config";
import {
  getTokenFromStorage,
  removeTokenFromStorage,
  setTokenToStorage,
} from "../utils/storage";

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

        // Handle 401 - Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          removeTokenFromStorage();
          // Redirect to login
          window.location.href = "/login";
          return Promise.reject(error);
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
