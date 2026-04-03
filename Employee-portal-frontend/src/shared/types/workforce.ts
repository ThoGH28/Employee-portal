export interface WFHRequest {
  id: string;
  employee: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  status_display: string;
  approved_by: string | null;
  approved_by_name: string;
  approval_comment: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  employee: string;
  employee_name: string;
  contract_type: string;
  contract_type_display: string;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  basic_salary: number;
  status: "active" | "expired" | "terminated";
  status_display: string;
  contract_file: string | null;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  description: string;
  is_paid: boolean;
  created_at: string;
}
