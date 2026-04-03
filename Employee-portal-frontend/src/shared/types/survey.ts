export interface SurveyQuestion {
  id: string;
  survey: string;
  text: string;
  question_type: "text" | "rating" | "single_choice" | "multi_choice";
  question_type_display: string;
  choices: string[];
  order: number;
  is_required: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  creator: string;
  target_department: string;
  start_date: string;
  end_date: string;
  is_anonymous: boolean;
  status: "draft" | "active" | "closed";
  status_display: string;
  questions: SurveyQuestion[];
  response_count: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyAnswer {
  question: string;
  text_answer?: string;
  rating_answer?: number;
  choice_answers?: string[];
}

export interface SurveyResponsePayload {
  survey: string;
  answers: SurveyAnswer[];
}
