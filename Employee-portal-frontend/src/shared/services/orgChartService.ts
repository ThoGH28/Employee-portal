import api from "./api";
import type { OrgChartNode, DepartmentCount } from "../types/orgChart";

export const orgChartService = {
  getOrgChart: async (department?: string): Promise<OrgChartNode[]> => {
    const params = department ? { department } : {};
    const response = await api.get("/employees/org-chart/", { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  getDepartments: async (): Promise<DepartmentCount[]> => {
    const response = await api.get("/employees/org-chart/departments/");
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  getByDepartment: async (department: string): Promise<OrgChartNode[]> => {
    const response = await api.get("/employees/org-chart/by_department/", {
      params: { department },
    });
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },
};
