import api from "./api";
import type {
  Document,
  SearchResult,
  DocumentSearchQuery,
  PaginatedResponse,
} from "../types";

export const documentService = {
  // Get all documents
  listDocuments: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<Document>>("/documents/", {
      params: { page, limit },
    }),

  // Get document by ID
  getDocumentById: (id: string) => api.get<Document>(`/documents/${id}/`),

  // Upload document
  uploadDocument: (file: File, data: any = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    return api.post<Document>("/documents/upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Delete document
  deleteDocument: (id: string) => api.delete(`/documents/${id}/`),

  // Download document
  downloadDocument: (id: string) =>
    api.get(`/documents/${id}/download/`, { responseType: "blob" }),
};

export const searchService = {
  // AI-powered search
  search: (query: DocumentSearchQuery) =>
    api.get<PaginatedResponse<SearchResult>>("/search/", { params: query }),

  // Get search suggestions
  getSuggestions: (query: string) =>
    api.get<string[]>("/search/suggestions/", { params: { q: query } }),

  // Get search history
  getSearchHistory: () => api.get<string[]>("/search/history/"),

  // Clear search history
  clearSearchHistory: () => api.post("/search/history/clear/"),
};
