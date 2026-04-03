import api from "./api";
import type { KPIGoal, PerformanceReview } from "../types/performance";

export const performanceService = {
  // KPI Goals
  getKPIGoals: (params?: Record<string, string>) =>
    api
      .get("/performance/kpi/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createKPIGoal: (data: Partial<KPIGoal>) =>
    api.post<KPIGoal>("/performance/kpi/", data).then((r) => r.data),

  updateKPIGoal: (id: string, data: Partial<KPIGoal>) =>
    api.patch<KPIGoal>(`/performance/kpi/${id}/`, data).then((r) => r.data),

  deleteKPIGoal: (id: string) => api.delete(`/performance/kpi/${id}/`),

  // Performance Reviews
  getReviews: (params?: Record<string, string>) =>
    api
      .get("/performance/reviews/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createReview: (data: Partial<PerformanceReview>) =>
    api
      .post<PerformanceReview>("/performance/reviews/", data)
      .then((r) => r.data),

  updateReview: (id: string, data: Partial<PerformanceReview>) =>
    api
      .patch<PerformanceReview>(`/performance/reviews/${id}/`, data)
      .then((r) => r.data),

  acknowledgeReview: (id: string, employee_comments?: string) =>
    api
      .post<PerformanceReview>(`/performance/reviews/${id}/acknowledge/`, {
        employee_comments,
      })
      .then((r) => r.data),
};
