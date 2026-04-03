import api from "./api";
import type {
  TrainingProgram,
  TrainingEnrollment,
  Certificate,
} from "../types/training";

export const trainingService = {
  getPrograms: (params?: Record<string, string>) =>
    api
      .get("/training/programs/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createProgram: (data: Partial<TrainingProgram>) =>
    api.post<TrainingProgram>("/training/programs/", data).then((r) => r.data),

  updateProgram: (id: string, data: Partial<TrainingProgram>) =>
    api
      .patch<TrainingProgram>(`/training/programs/${id}/`, data)
      .then((r) => r.data),

  enroll: (id: string) =>
    api
      .post<TrainingEnrollment>(`/training/programs/${id}/enroll/`)
      .then((r) => r.data),

  unenroll: (id: string) =>
    api.post(`/training/programs/${id}/unenroll/`).then((r) => r.data),

  getMyEnrollments: (params?: Record<string, string>) =>
    api
      .get("/training/enrollments/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  getAllEnrollments: (params?: Record<string, string>) =>
    api
      .get("/training/enrollments/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  updateEnrollment: (id: string, data: Partial<TrainingEnrollment>) =>
    api
      .patch<TrainingEnrollment>(`/training/enrollments/${id}/`, data)
      .then((r) => r.data),

  getCertificates: (params?: Record<string, string>) =>
    api
      .get("/training/certificates/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createCertificate: (data: FormData) =>
    api
      .post<Certificate>("/training/certificates/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  deleteCertificate: (id: string) =>
    api.delete(`/training/certificates/${id}/`),
};
