import api from "./api";
import type { Notification } from "../types/notification";

export const notificationService = {
  getNotifications: (params?: Record<string, string>) =>
    api
      .get("/notifications/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  getUnreadCount: () =>
    api
      .get<{ count: number }>("/notifications/unread-count/")
      .then((r) => r.data),

  markRead: (id: string) =>
    api
      .post<Notification>(`/notifications/${id}/mark-read/`)
      .then((r) => r.data),

  markAllRead: () =>
    api
      .post<{ marked_read: number }>("/notifications/mark-all-read/")
      .then((r) => r.data),
};
