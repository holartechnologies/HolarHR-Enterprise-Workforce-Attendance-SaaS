"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Building2, Users, LayoutDashboard, ShieldAlert, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (session?.user?.role !== "SUPER_ADMIN") {
    return <div className="flex items-center justify-center h-screen">Access denied</div>;
  }

  const handleNav = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-56 bg-slate-900 text-white flex flex-col shrink-0 transition-transform duration-200",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <Link href="/admin" onClick={handleNav} className="flex items-center gap-2 font-bold text-white">
            <ShieldAlert className="h-5 w-5 text-blue-400" />
            <span>Admin Panel</span>
          </Link>
          <Button variant="ghost" size="icon" className="text-white md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNav}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Link href="/dashboard" onClick={handleNav} className="text-sm text-slate-400 hover:text-white">
            &larr; Back to app
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-white px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Admin Panel</span>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
