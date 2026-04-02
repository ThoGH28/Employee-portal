import api from "./api";
import type {
  Employee,
  LeaveRequest,
  LeaveRequestPayload,
  Announcement,
  PaginatedResponse,
} from "../types";

export const employeeService = {
  getProfile: () => api.get<Employee>("/employees/profiles/my_profile/"),

  getEmployeeById: (id: string) =>
    api.get<Employee>(`/employees/profiles/${id}/`),

  listEmployees: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<Employee>>("/employees/profiles/", {
      params: { page, limit },
    }),

  updateProfile: (data: Partial<Employee>) =>
    api.patch<Employee>("/employees/profiles/my_profile/", data),

  adminUpdateEmployee: (id: string, data: Record<string, any>) =>
    api.patch<Employee>(`/employees/profiles/${id}/admin-update/`, data),
};

export const leaveService = {
  getMyLeaveRequests: () => api.get<LeaveRequest[]>("/employees/leave/"),

  createLeaveRequest: (data: LeaveRequestPayload) =>
    api.post<LeaveRequest>("/employees/leave/", data),

  updateLeaveRequest: (id: string, data: Partial<LeaveRequestPayload>) =>
    api.patch<LeaveRequest>(`/employees/leave/${id}/`, data),

  cancelLeaveRequest: (id: string) => api.delete(`/employees/leave/${id}/`),

  getLeaveBalance: () =>
    api.get<{ total: number; used: number; remaining: number }>(
      "/employees/leave/balance/",
    ),
};

export const announcementService = {
  listAnnouncements: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Announcement>>("/employees/announcements/", {
      params: { page, limit },
    }),

  getAnnouncementById: (id: string) =>
    api.get<Announcement>(`/employees/announcements/${id}/`),

  createAnnouncement: (data: Partial<Announcement>) =>
    api.post<Announcement>("/employees/announcements/", data),

  updateAnnouncement: (id: string, data: Partial<Announcement>) =>
    api.patch<Announcement>(`/employees/announcements/${id}/`, data),

  deleteAnnouncement: (id: string) =>
    api.delete(`/employees/announcements/${id}/`),
};
