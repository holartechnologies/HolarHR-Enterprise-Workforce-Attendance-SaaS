"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Clock,
  BarChart3,
  Building2,
  GitBranch,
  CalendarClock,
  FileText,
  Settings,
  CreditCard,
  Brain,
  LogOut,
  ShieldAlert,
} from "lucide-react";

const roleNavItems: Record<string, { href: string; label: string; icon: any }[]> = {
  EMPLOYEE: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/attendance", label: "Attendance", icon: Clock },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/leave", label: "Leave", icon: FileText },
  ],
  DEPARTMENT_MANAGER: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/attendance", label: "Attendance", icon: Clock },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/departments", label: "Departments", icon: Building2 },
    { href: "/leave", label: "Leave", icon: FileText },
  ],
  HR_MANAGER: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/attendance", label: "Attendance", icon: Clock },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/departments", label: "Departments", icon: Building2 },
    { href: "/branches", label: "Branches", icon: GitBranch },
    { href: "/shifts", label: "Shifts", icon: CalendarClock },
    { href: "/leave", label: "Leave", icon: FileText },
    { href: "/ai", label: "AI Insights", icon: Brain },
  ],
  COMPANY_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/attendance", label: "Attendance", icon: Clock },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/departments", label: "Departments", icon: Building2 },
    { href: "/branches", label: "Branches", icon: GitBranch },
    { href: "/shifts", label: "Shifts", icon: CalendarClock },
    { href: "/leave", label: "Leave", icon: FileText },
    { href: "/ai", label: "AI Insights", icon: Brain },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => d.success && d.data?.logo && setLogo(d.data.logo))
      .catch(() => {});
  }, []);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          {logo ? (
            <img src={logo} alt="Logo" className="h-8 w-auto max-w-[140px] object-contain" />
          ) : (
            <span className="flex items-center gap-2 text-xl">
              <Clock className="h-6 w-6 text-primary" />
              <span>HolarHR</span>
            </span>
          )}
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {session?.user?.role === "SUPER_ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-2",
              pathname.startsWith("/admin")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
        {(roleNavItems[session?.user?.role || ""] || roleNavItems.COMPANY_ADMIN).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.companyName}</p>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
