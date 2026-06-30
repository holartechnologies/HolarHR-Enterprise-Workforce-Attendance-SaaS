import { UserRole } from "@prisma/client";

type Permission =
  | "employee:manage"
  | "employee:view"
  | "attendance:clock_in"
  | "attendance:view"
  | "attendance:manage"
  | "reports:view"
  | "reports:export"
  | "leave:request"
  | "leave:approve"
  | "settings:manage"
  | "billing:view"
  | "billing:manage"
  | "ai:access"
  | "department:manage"
  | "branch:manage"
  | "shift:manage"
  | "user:manage"
  | "admin:all";

const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ["admin:all"],
  COMPANY_ADMIN: [
    "employee:manage",
    "employee:view",
    "attendance:clock_in",
    "attendance:view",
    "attendance:manage",
    "reports:view",
    "reports:export",
    "leave:request",
    "leave:approve",
    "settings:manage",
    "billing:view",
    "billing:manage",
    "ai:access",
    "department:manage",
    "branch:manage",
    "shift:manage",
    "user:manage",
  ],
  HR_MANAGER: [
    "employee:manage",
    "employee:view",
    "attendance:view",
    "attendance:manage",
    "reports:view",
    "reports:export",
    "leave:request",
    "leave:approve",
    "ai:access",
    "department:manage",
    "shift:manage",
  ],
  DEPARTMENT_MANAGER: [
    "employee:view",
    "attendance:clock_in",
    "attendance:view",
    "reports:view",
    "leave:request",
    "leave:approve",
    "department:manage",
  ],
  EMPLOYEE: [
    "employee:view",
    "attendance:clock_in",
    "attendance:view",
    "reports:view",
    "leave:request",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  if (role === "SUPER_ADMIN") return true;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

export function isCompanyRole(role: UserRole): boolean {
  return ["COMPANY_ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER", "EMPLOYEE"].includes(role);
}

export function isManagementRole(role: UserRole): boolean {
  return ["COMPANY_ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER"].includes(role);
}
