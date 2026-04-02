import api from "./api";
import type {
  AdministrativeRequest,
  AdministrativeRequestPayload,
} from "../types/adminRequest";

export const adminRequestService = {
  getMyRequests: async (): Promise<AdministrativeRequest[]> => {
    const response = await api.get("/employees/admin-requests/my_requests/");
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  getAllRequests: async (): Promise<AdministrativeRequest[]> => {
    const response = await api.get("/employees/admin-requests/");
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  getRequest: async (id: string): Promise<AdministrativeRequest> => {
    const response = await api.get(`/employees/admin-requests/${id}/`);
    return response.data;
  },

  createRequest: async (
    data: AdministrativeRequestPayload,
  ): Promise<AdministrativeRequest> => {
    const formData = new FormData();
    formData.append("request_type", data.request_type);
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("priority", data.priority);
    if (data.attachment) {
      formData.append("attachment", data.attachment);
    }
    const response = await api.post("/employees/admin-requests/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  processRequest: async (
    id: string,
    data: { status: string; admin_comment: string },
  ): Promise<AdministrativeRequest> => {
    const response = await api.post(
      `/employees/admin-requests/${id}/process/`,
      data,
    );
    return response.data;
  },

  cancelRequest: async (id: string): Promise<AdministrativeRequest> => {
    const response = await api.post(`/employees/admin-requests/${id}/cancel/`);
    return response.data;
  },
};
