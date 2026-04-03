import type { User } from "../types";

/**
 * Check if user has admin role
 */
export const isAdmin = (user: User | null): boolean => user?.role === "admin";

/**
 * Check if user has HR role
 */
export const isHR = (user: User | null): boolean => user?.role === "hr";

/**
 * Check if user is admin or HR
 */
export const isAdminOrHR = (user: User | null): boolean =>
  user?.role === "admin" || user?.role === "hr";

/**
 * Check if user is a department manager
 */
export const isDeptManager = (user: User | null): boolean =>
  user?.is_department_manager === true;

/**
 * Check if user is department manager or above (admin/hr)
 */
export const isDeptManagerOrAbove = (user: User | null): boolean =>
  isAdminOrHR(user) || isDeptManager(user);

/**
 * Check if user can view reports
 */
export const canViewReports = (user: User | null): boolean =>
  isAdminOrHR(user) || isDeptManager(user);

/**
 * Check if user can approve leave requests
 */
export const canApproveLeave = (user: User | null): boolean =>
  isAdminOrHR(user) || isDeptManager(user);

/**
 * Check if user can manage employees (create/edit/delete)
 */
export const canManageEmployees = (user: User | null): boolean =>
  isAdminOrHR(user);

/**
 * Check if user can manage documents (delete)
 */
export const canDeleteDocuments = (user: User | null): boolean =>
  isAdminOrHR(user);

/**
 * Check if user can manage announcements
 */
export const canManageAnnouncements = (user: User | null): boolean =>
  isAdminOrHR(user);

/**
 * Check if user can manage payslips (create/edit)
 */
export const canManagePayslips = (user: User | null): boolean =>
  isAdminOrHR(user);

/**
 * Check if user can process admin requests
 */
export const canProcessRequests = (user: User | null): boolean =>
  isAdminOrHR(user);

/**
 * Check if user can access admin panel
 */
export const canAccessAdminPanel = (user: User | null): boolean =>
  user?.role === "admin";

/**
 * Check if user can impersonate other users
 */
export const canImpersonate = (user: User | null): boolean =>
  user?.role === "admin";

/**
 * Sidebar items visibility config per effective role
 */
export interface SidebarVisibility {
  dashboard: boolean;
  profile: boolean;
  payslips: boolean;
  requests: boolean;
  orgChart: boolean;
  documents: boolean;
  admin: boolean;
  reports: boolean;
  leaveApproval: boolean;
  help: boolean;
  attendance: boolean;
  performance: boolean;
  training: boolean;
  assets: boolean;
  expenses: boolean;
  workforce: boolean;
  notifications: boolean;
  surveys: boolean;
}

export const getSidebarVisibility = (user: User | null): SidebarVisibility => {
  if (!user) {
    return {
      dashboard: false,
      profile: false,
      payslips: false,
      requests: false,
      orgChart: false,
      documents: false,
      admin: false,
      reports: false,
      leaveApproval: false,
      help: false,
      attendance: false,
      performance: false,
      training: false,
      assets: false,
      expenses: false,
      workforce: false,
      notifications: false,
      surveys: false,
    };
  }

  const base = {
    dashboard: true,
    profile: true,
    payslips: true,
    requests: true,
    orgChart: true,
    documents: true,
    admin: false,
    reports: false,
    leaveApproval: false,
    help: true,
    attendance: true,
    performance: true,
    training: true,
    assets: true,
    expenses: true,
    workforce: true,
    notifications: true,
    surveys: true,
  };

  if (user.role === "admin") {
    return { ...base, admin: true, reports: true, leaveApproval: true };
  }
  if (user.role === "hr") {
    return { ...base, reports: true, leaveApproval: true };
  }
  if (user.is_department_manager) {
    return { ...base, reports: true, leaveApproval: true };
  }
  // Regular employee
  return base;
};
