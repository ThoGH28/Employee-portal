export interface AdministrativeRequest {
  id: string;
  employee: string;
  employee_name: string;
  request_type:
    | "employment_verification"
    | "card_replacement"
    | "salary_certificate"
    | "experience_letter"
    | "other";
  request_type_display: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "approved" | "rejected" | "completed";
  processed_by?: string;
  processed_by_name?: string;
  admin_comment: string;
  attachment?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AdministrativeRequestPayload {
  request_type: string;
  title: string;
  description: string;
  priority: string;
  attachment?: File;
}
