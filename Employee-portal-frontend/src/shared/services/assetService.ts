import api from "./api";
import type { CompanyAsset, AssetAssignment } from "../types/assets";

export const assetService = {
  getAssets: (params?: Record<string, string>) =>
    api
      .get("/assets/items/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),

  createAsset: (data: Partial<CompanyAsset>) =>
    api.post<CompanyAsset>("/assets/items/", data).then((r) => r.data),

  updateAsset: (id: string, data: Partial<CompanyAsset>) =>
    api.patch<CompanyAsset>(`/assets/items/${id}/`, data).then((r) => r.data),

  assignAsset: (
    id: string,
    data: {
      employee: string;
      assigned_date: string;
      expected_return_date?: string;
      notes?: string;
    },
  ) =>
    api
      .post<AssetAssignment>(`/assets/items/${id}/assign/`, data)
      .then((r) => r.data),

  returnAsset: (
    id: string,
    data: { condition_on_return: string; notes?: string },
  ) =>
    api
      .post<AssetAssignment>(`/assets/items/${id}/return/`, data)
      .then((r) => r.data),

  getAssignments: (params?: Record<string, string>) =>
    api
      .get("/assets/assignments/", { params })
      .then((r) => (Array.isArray(r.data) ? r.data : (r.data.results ?? []))),
};
