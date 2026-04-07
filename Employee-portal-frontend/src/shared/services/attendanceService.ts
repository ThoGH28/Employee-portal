import api from "./api";
import type {
  AttendanceRecord,
  AttendanceSummary,
  OvertimeRequest,
  LatePardon,
} from "../types/attendance";

export const attendanceService = {
  // Attendance Records
  getMyRecords: (params?: Record<string, string>) =>
    api
      .get<
        AttendanceRecord[] | { results: AttendanceRecord[] }
      >("/attendance/records/", { params })
      .then((r) =>
        Array.isArray(r.data) ? r.data : ((r.data as any).results ?? []),
      ),

  getAllRecords: (params?: Record<string, string>) =>
    api
      .get<
        AttendanceRecord[] | { results: AttendanceRecord[] }
      >("/attendance/records/", { params })
      .then((r) =>
        Array.isArray(r.data) ? r.data : ((r.data as any).results ?? []),
      ),

  clockIn: () =>
    api
      .post<
        AttendanceRecord & { late_warning?: string }
      >("/attendance/records/clock-in/")
      .then((r) => r.data),

  clockOut: () =>
    api
      .post<AttendanceRecord>("/attendance/records/clock-out/")
      .then((r) => r.data),

  getToday: () =>
    api
      .get<AttendanceRecord>("/attendance/records/today/")
      .then((r) => r.data)
      .catch((err) => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),

  getSummary: (params?: Record<string, string>) =>
    api
      .get<AttendanceSummary>("/attendance/records/summary/", { params })
      .then((r) => r.data),

  updateRecord: (id: string, data: Partial<AttendanceRecord>) =>
    api
      .patch<AttendanceRecord>(`/attendance/records/${id}/`, data)
      .then((r) => r.data),

  // Overtime Requests
  getOvertimeRequests: (params?: Record<string, string>) =>
    api
      .get<
        OvertimeRequest[] | { results: OvertimeRequest[] }
      >("/attendance/overtime/", { params })
      .then((r) =>
        Array.isArray(r.data) ? r.data : ((r.data as any).results ?? []),
      ),

  createOvertimeRequest: (data: Partial<OvertimeRequest>) =>
    api
      .post<OvertimeRequest>("/attendance/overtime/", data)
      .then((r) => r.data),

  approveOvertime: (
    id: string,
    data: { status: string; approval_comment?: string },
  ) =>
    api
      .post<OvertimeRequest>(`/attendance/overtime/${id}/approve/`, data)
      .then((r) => r.data),

  // Late Pardons
  getLatePardons: (params?: Record<string, string>) =>
    api
      .get<
        LatePardon[] | { results: LatePardon[] }
      >("/attendance/late-pardons/", { params })
      .then((r) =>
        Array.isArray(r.data) ? r.data : ((r.data as any).results ?? []),
      ),

  createLatePardon: (data: { attendance_record: string; reason: string }) =>
    api.post<LatePardon>("/attendance/late-pardons/", data).then((r) => r.data),

  approvePardon: (
    id: string,
    data: { status: string; approval_comment?: string },
  ) =>
    api
      .post<LatePardon>(`/attendance/late-pardons/${id}/approve/`, data)
      .then((r) => r.data),
};
