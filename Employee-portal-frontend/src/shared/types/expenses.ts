export interface ExpenseItem {
  id: string;
  report: string;
  category: string;
  category_display: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_file: string | null;
  created_at: string;
}

export interface ExpenseReport {
  id: string;
  employee: string;
  employee_name: string;
  title: string;
  description: string;
  total_amount: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  status_display: string;
  approved_by: string | null;
  approved_by_name: string;
  approval_comment: string;
  approved_at: string | null;
  payment_date: string | null;
  items: ExpenseItem[];
  created_at: string;
  updated_at: string;
}
