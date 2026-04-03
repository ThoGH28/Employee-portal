import api from "./api";
import type { Survey, SurveyResponsePayload } from "../types/survey";

export const surveyService = {
  getSurveys: (params?: Record<string, string>) =>
    api
      .get("/surveys/surveys/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  getSurvey: (id: string) =>
    api.get<Survey>(`/surveys/surveys/${id}/`).then((r) => r.data),

  createSurvey: (data: Partial<Survey>) =>
    api.post<Survey>("/surveys/surveys/", data).then((r) => r.data),

  updateSurvey: (id: string, data: Partial<Survey>) =>
    api.patch<Survey>(`/surveys/surveys/${id}/`, data).then((r) => r.data),

  submitResponse: (id: string, data: SurveyResponsePayload) =>
    api.post(`/surveys/surveys/${id}/submit/`, data).then((r) => r.data),

  getResults: (id: string) =>
    api.get(`/surveys/surveys/${id}/results/`).then((r) => r.data),
};
