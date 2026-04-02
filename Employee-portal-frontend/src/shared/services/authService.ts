import api from "./api";
import type { LoginRequest, LoginResponse, User } from "../types";

export const authService = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>("/auth/login/", credentials),

  logout: () => api.post("/auth/logout/"),

  refreshToken: (refreshToken: string) =>
    api.post<{ access: string }>("/auth/refresh/", { refresh: refreshToken }),

  getCurrentUser: () => api.get<User>("/auth/profile/"),

  updateProfile: (data: Partial<User>) =>
    api.patch<User>("/auth/profile/update/", data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post("/auth/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  impersonate: (userId: string) =>
    api.post<LoginResponse>("/auth/impersonate/", { user_id: userId }),
};
