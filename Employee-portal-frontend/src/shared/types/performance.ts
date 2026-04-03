export interface KPIGoal {
  id: string;
  employee: string;
  employee_name: string;
  created_by: string;
  year: number;
  period: "q1" | "q2" | "q3" | "q4" | "h1" | "h2" | "annual";
  period_display: string;
  title: string;
  description: string;
  target_value: number;
  actual_value: number;
  unit: string;
  weight: number;
  achievement_rate: number;
  status: "active" | "completed" | "cancelled";
  status_display: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceReview {
  id: string;
  employee: string;
  employee_name: string;
  reviewer: string | null;
  reviewer_name: string;
  review_period: string;
  year: number;
  work_quality: number;
  work_efficiency: number;
  teamwork: number;
  initiative: number;
  overall_score: number;
  strengths: string;
  areas_for_improvement: string;
  goals_next_period: string;
  reviewer_comments: string;
  employee_comments: string;
  status: "draft" | "submitted" | "acknowledged";
  status_display: string;
  created_at: string;
  updated_at: string;
}
