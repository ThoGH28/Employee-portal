import api from "./api";
import type { ExpenseReport, ExpenseItem } from "../types/expenses";

export const expenseService = {
  getReports: (params?: Record<string, string>) =>
    api
      .get("/expenses/reports/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  getReport: (id: string) =>
    api.get<ExpenseReport>(`/expenses/reports/${id}/`).then((r) => r.data),

  createReport: (data: { title: string; description?: string }) =>
    api.post<ExpenseReport>("/expenses/reports/", data).then((r) => r.data),

  updateReport: (id: string, data: Partial<ExpenseReport>) =>
    api
      .patch<ExpenseReport>(`/expenses/reports/${id}/`, data)
      .then((r) => r.data),

  submitReport: (id: string) =>
    api
      .post<ExpenseReport>(`/expenses/reports/${id}/submit/`)
      .then((r) => r.data),

  processReport: (
    id: string,
    data: { status: string; approval_comment?: string; payment_date?: string },
  ) =>
    api
      .post<ExpenseReport>(`/expenses/reports/${id}/process/`, data)
      .then((r) => r.data),

  addItem: (data: Partial<ExpenseItem> | FormData) =>
    api
      .post<ExpenseItem>("/expenses/items/", data, {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : undefined,
      })
      .then((r) => r.data),

  deleteItem: (id: string) => api.delete(`/expenses/items/${id}/`),
};
