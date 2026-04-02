// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "hr" | "employee";
  effective_role: "admin" | "hr" | "dept_manager" | "employee";
  department: string;
  is_department_manager: boolean;
  avatar?: string;
}

// Employee types
export interface Employee {
  id: string;
  user: User;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  designation: string;
  employee_id: string;
  joining_date: string;
  date_of_joining: string;
  date_of_birth?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  emergency_contact: string;
  emergency_contact_phone: string;
  bank_name: string;
  bank_account_number: string;
  bank_branch: string;
  manager?: string;
  manager_name?: string;
  profile_image?: string;
  bio: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

// Leave request types
export interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface LeaveRequestPayload {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

// HR Announcement types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  category: "general" | "event" | "policy" | "maintenance";
}

// Chat types
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  status: "sent" | "thinking" | "error";
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface StreamingMessage {
  type: "message" | "error" | "complete";
  content?: string;
  error?: string;
}

// Document types
export interface Document {
  id: string;
  title: string;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
  content_type: string;
  size: number;
}

export interface SearchResult {
  id: string;
  document_id: string;
  title: string;
  snippet: string;
  relevance_score: number;
  matched_text: string;
}

export interface DocumentSearchQuery {
  query: string;
  limit?: number;
  offset?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}
