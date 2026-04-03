export interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  instructor: string;
  location: string;
  target_department: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  enrolled_count: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  status_display: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingEnrollment {
  id: string;
  employee: string;
  employee_name: string;
  program: string;
  program_title: string;
  status: "enrolled" | "completed" | "cancelled" | "no_show";
  status_display: string;
  completion_date: string | null;
  score: number | null;
  feedback: string;
  enrolled_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  employee: string;
  employee_name: string;
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  certificate_file: string | null;
  description: string;
  created_at: string;
}
