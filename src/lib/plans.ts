import { PlanType } from "@prisma/client";
import { PlanLimits } from "@/types";

export const PLANS: Record<PlanType, PlanLimits & { id: PlanType; name: string; price: number; stripePriceId?: string }> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    maxEmployees: 3,
    maxBranches: 1,
    maxDepartments: 5,
    qrAttendance: false,
    gpsAttendance: false,
    mobileFingerprint: false,
    biometricDevices: 0,
    aiFeatures: false,
    apiAccess: false,
    prioritySupport: false,
    reports: true,
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    price: 29,
    maxEmployees: 25,
    maxBranches: 2,
    maxDepartments: 10,
    qrAttendance: false,
    gpsAttendance: false,
    mobileFingerprint: false,
    biometricDevices: 0,
    aiFeatures: false,
    apiAccess: false,
    prioritySupport: false,
    reports: true,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    price: 99,
    maxEmployees: 250,
    maxBranches: 10,
    maxDepartments: 25,
    qrAttendance: true,
    gpsAttendance: true,
    mobileFingerprint: true,
    biometricDevices: 5,
    aiFeatures: false,
    apiAccess: true,
    prioritySupport: false,
    reports: true,
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 299,
    maxEmployees: 99999,
    maxBranches: 999,
    maxDepartments: 999,
    qrAttendance: true,
    gpsAttendance: true,
    mobileFingerprint: true,
    biometricDevices: 99,
    aiFeatures: true,
    apiAccess: true,
    prioritySupport: true,
    reports: true,
  },
};

export function getPlanLimits(planType: PlanType): PlanLimits {
  const plan = PLANS[planType];
  return {
    maxEmployees: plan.maxEmployees,
    maxBranches: plan.maxBranches,
    maxDepartments: plan.maxDepartments,
    qrAttendance: plan.qrAttendance,
    gpsAttendance: plan.gpsAttendance,
    mobileFingerprint: plan.mobileFingerprint,
    biometricDevices: plan.biometricDevices,
    aiFeatures: plan.aiFeatures,
    apiAccess: plan.apiAccess,
    prioritySupport: plan.prioritySupport,
    reports: plan.reports,
  };
}

export function canAddEmployee(planType: PlanType, currentCount: number): boolean {
  return currentCount < PLANS[planType].maxEmployees;
}

export function canAddBranch(planType: PlanType, currentCount: number): boolean {
  return currentCount < PLANS[planType].maxBranches;
}

export function canAddDepartment(planType: PlanType, currentCount: number): boolean {
  return currentCount < PLANS[planType].maxDepartments;
}

export function canAddDevice(planType: PlanType, currentCount: number): boolean {
  const max = PLANS[planType].biometricDevices;
  return max > 0 && currentCount < max;
}

export function hasFeature(planType: PlanType, feature: keyof PlanLimits): boolean {
  return PLANS[planType][feature] === true;
}
