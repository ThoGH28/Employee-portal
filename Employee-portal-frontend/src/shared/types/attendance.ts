export interface AttendanceRecord {
  id: string;
  employee: string;
  employee_name: string;
  employee_id_no: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: "present" | "absent" | "late" | "wfh" | "half_day";
  work_hours: number;
  late_minutes: number;
  penalty_amount: number;
  has_pardon_request: boolean;
  pardon_status: "pending" | "approved" | "rejected" | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  wfh: number;
  half_day: number;
  total_days: number;
  total_hours: number;
}

export interface OvertimeRequest {
  id: string;
  employee: string;
  employee_name: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
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

export interface LatePardon {
  id: string;
  attendance_record: string;
  employee_name: string;
  date: string;
  late_minutes: number;
  penalty_amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  status_display: string;
  approved_by: string | null;
  approved_by_name: string;
  approval_comment: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}
