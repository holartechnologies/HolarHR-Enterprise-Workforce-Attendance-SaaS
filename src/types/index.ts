import { UserRole, PlanType, EmployeeStatus, AttendanceStatus, LeaveStatus, LeaveType } from "@prisma/client";

export type { UserRole, PlanType, EmployeeStatus, AttendanceStatus, LeaveStatus, LeaveType };

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  employeeId?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  user?: SessionUser;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeave: number;
  attendanceRate: number;
  totalHoursThisWeek: number;
  activeBranches: number;
  activeDepartments: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  totalHours: number | null;
  lateMinutes: number;
  status: AttendanceStatus;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  departmentId?: string;
  branchId?: string;
  employeeId?: string;
  status?: AttendanceStatus;
}

export interface AIInsight {
  type: "insight" | "alert" | "recommendation";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
}

export interface PlanLimits {
  maxEmployees: number;
  maxBranches: number;
  maxDepartments: number;
  qrAttendance: boolean;
  gpsAttendance: boolean;
  mobileFingerprint: boolean;
  biometricDevices: number;
  aiFeatures: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  reports: boolean;
}
