import api from "./api";
import type { Payslip } from "../types/payslip";

export const payslipService = {
  /**
   * Get all payslips (HR/Admin only)
   */
  getPayslips: async (): Promise<Payslip[]> => {
    const response = await api.get("/employees/payslips/");
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  /**
   * Get current user's payslips
   */
  getMyPayslips: async (): Promise<Payslip[]> => {
    const response = await api.get("/employees/payslips/my_payslips/");
    const data = response.data;
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  /**
   * Get a specific payslip
   */
  getPayslip: async (id: string): Promise<Payslip> => {
    const response = await api.get(`/employees/payslips/${id}/`);
    return response.data;
  },

  /**
   * Create a new payslip (HR/Admin only)
   */
  createPayslip: async (payslipData: Partial<Payslip>): Promise<Payslip> => {
    const formData = new FormData();
    Object.entries(payslipData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const anyValue = value as any;
        if (anyValue instanceof File) {
          formData.append(key, anyValue);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await api.post("/employees/payslips/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Update a payslip (HR/Admin only)
   */
  updatePayslip: async (
    id: string,
    payslipData: Partial<Payslip>,
  ): Promise<Payslip> => {
    const formData = new FormData();
    Object.entries(payslipData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const anyValue = value as any;
        if (anyValue instanceof File) {
          formData.append(key, anyValue);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await api.patch(`/employees/payslips/${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Delete a payslip (HR/Admin only)
   */
  deletePayslip: async (id: string): Promise<void> => {
    await api.delete(`/employees/payslips/${id}/`);
  },

  /**
   * Download payslip PDF
   */
  downloadPayslip: async (
    id: string,
  ): Promise<{ pdf_url: string; month_year: string }> => {
    const response = await api.get(`/employees/payslips/${id}/download/`);
    return response.data;
  },

  /**
   * Filter payslips by status and month
   */
  filterPayslips: async (
    status?: string,
    month_year?: string,
  ): Promise<Payslip[]> => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (month_year) params.append("month_year", month_year);

    const response = await api.get(`/employees/payslips/?${params.toString()}`);
    return response.data;
  },
};
