import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function generateEmployeeCode(companySlug: string, index: number): string {
  const prefix = companySlug.slice(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

export function calculateHours(clockIn: Date, clockOut: Date): number {
  const diff = clockOut.getTime() - clockIn.getTime();
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
}

export function calculateLateMinutes(clockIn: Date, shiftStart: string): number {
  const [hours, minutes] = shiftStart.split(":").map(Number);
  const shiftDate = new Date(clockIn);
  shiftDate.setHours(hours, minutes, 0, 0);
  const diff = clockIn.getTime() - shiftDate.getTime();
  return diff > 0 ? Math.floor(diff / (1000 * 60)) : 0;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function paginate(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}
