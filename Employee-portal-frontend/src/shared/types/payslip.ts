export interface Payslip {
  id: string;
  employee: string;
  employee_name: string;
  month_year: string;
  month_year_display: string;
  basic_salary: number;
  house_rent_allowance: number;
  dearness_allowance: number;
  other_allowances: number;
  provident_fund: number;
  tax_deducted_at_source: number;
  insurance: number;
  other_deductions: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  status: "draft" | "finalized" | "distributed";
  pdf_file?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PayslipFilter {
  status?: string;
  month_year?: string;
  employee?: string;
}
