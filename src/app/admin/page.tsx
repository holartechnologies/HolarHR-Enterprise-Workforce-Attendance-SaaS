"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Clock, CreditCard } from "lucide-react";

interface Stats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  totalEmployees: number;
  totalAttendance: number;
  activeSubscriptions: number;
  planBreakdown: { name: string; count: number; price: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.data))
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Companies", value: stats?.totalCompanies ?? 0, icon: Building2 },
    { label: "Active", value: stats?.activeCompanies ?? 0, icon: Building2 },
    { label: "Inactive", value: stats?.inactiveCompanies ?? 0, icon: Building2 },
    { label: "Users", value: stats?.totalUsers ?? 0, icon: Users },
    { label: "Employees", value: stats?.totalEmployees ?? 0, icon: Clock },
    { label: "Active Subs", value: stats?.activeSubscriptions ?? 0, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">{c.label}</CardTitle>
                  <Icon className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{c.value}</div>
                </CardContent>
              </Card>
            );
          })}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-gray-700">Plan Distribution</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.planBreakdown.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{p.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{p.count} tenants</span>
                  <span className="text-sm text-gray-600">${p.price}/mo</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
