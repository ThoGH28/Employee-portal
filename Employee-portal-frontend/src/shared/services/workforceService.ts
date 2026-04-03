import api from "./api";
import type { WFHRequest, Contract, PublicHoliday } from "../types/workforce";

export const workforceService = {
  // WFH Requests
  getWFHRequests: (params?: Record<string, string>) =>
    api
      .get("/employees/wfh/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createWFHRequest: (data: {
    start_date: string;
    end_date: string;
    reason: string;
  }) => api.post<WFHRequest>("/employees/wfh/", data).then((r) => r.data),

  approveWFH: (
    id: string,
    data: { status: string; approval_comment?: string },
  ) =>
    api
      .post<WFHRequest>(`/employees/wfh/${id}/approve/`, data)
      .then((r) => r.data),

  cancelWFH: (id: string) =>
    api.post<WFHRequest>(`/employees/wfh/${id}/cancel/`).then((r) => r.data),

  // Contracts
  getContracts: (params?: Record<string, string>) =>
    api
      .get("/employees/contracts/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createContract: (data: FormData) =>
    api
      .post<Contract>("/employees/contracts/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  updateContract: (id: string, data: Partial<Contract>) =>
    api
      .patch<Contract>(`/employees/contracts/${id}/`, data)
      .then((r) => r.data),

  // Public Holidays
  getHolidays: (params?: Record<string, string>) =>
    api
      .get("/employees/holidays/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createHoliday: (data: Partial<PublicHoliday>) =>
    api.post<PublicHoliday>("/employees/holidays/", data).then((r) => r.data),

  updateHoliday: (id: string, data: Partial<PublicHoliday>) =>
    api
      .patch<PublicHoliday>(`/employees/holidays/${id}/`, data)
      .then((r) => r.data),

  deleteHoliday: (id: string) => api.delete(`/employees/holidays/${id}/`),
};
