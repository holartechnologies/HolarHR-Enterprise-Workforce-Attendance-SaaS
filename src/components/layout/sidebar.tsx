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
  Monitor,
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
    { href: "/devices", label: "Devices", icon: Monitor },
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
    { href: "/devices", label: "Devices", icon: Monitor },
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
    { href: "/devices", label: "Devices", icon: Monitor },
    { href: "/leave", label: "Leave", icon: FileText },
    { href: "/ai", label: "AI Insights", icon: Brain },
    { href: "/billing", label: "Billing", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ],
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => d.success && d.data?.logo && setLogo(d.data.logo))
      .catch(() => {});
  }, []);

  const handleNav = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex flex-col h-screen w-64 border-r bg-card transition-transform duration-200",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 shrink-0 items-center border-b px-6">
          <Link href="/dashboard" onClick={handleNav} className="flex items-center gap-2 font-bold">
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
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-1">
            {session?.user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                onClick={handleNav}
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
                  onClick={handleNav}
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
          </div>
        </nav>
        <div className="shrink-0 border-t p-4">
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
    </>
  );
}
