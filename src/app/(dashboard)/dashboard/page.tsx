"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, AlertTriangle, CheckCircle, Building2, TrendingUp } from "lucide-react";
import { DashboardStats } from "@/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") redirect("/login");
  }, [status]);

  useEffect(() => {
    fetch("/api/attendance/stats")
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.data))
      .catch(() => {});
  }, []);

  if (status === "loading") {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statCards = [
    { label: "Total Employees", value: stats?.totalEmployees ?? 0, icon: Users, color: "text-blue-600" },
    { label: "Present Today", value: stats?.presentToday ?? 0, icon: CheckCircle, color: "text-green-600" },
    { label: "Late Today", value: stats?.lateToday ?? 0, icon: Clock, color: "text-yellow-600" },
    { label: "Absent Today", value: stats?.absentToday ?? 0, icon: AlertTriangle, color: "text-red-600" },
    { label: "Attendance Rate", value: `${stats?.attendanceRate ?? 0}%`, icon: TrendingUp, color: "text-purple-600" },
    { label: "Branches", value: stats?.activeBranches ?? 0, icon: Building2, color: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.name?.split(" ")[0]}! Here is your attendance overview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <a href="/attendance" className="p-3 rounded-lg border hover:bg-accent transition-colors text-sm font-medium text-center">
                Clock In/Out
              </a>
              <a href="/employees" className="p-3 rounded-lg border hover:bg-accent transition-colors text-sm font-medium text-center">
                View Employees
              </a>
              <a href="/reports" className="p-3 rounded-lg border hover:bg-accent transition-colors text-sm font-medium text-center">
                Generate Report
              </a>
              <a href="/ai" className="p-3 rounded-lg border hover:bg-accent transition-colors text-sm font-medium text-center">
                AI Insights
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Present</span>
                <Badge variant="success">{stats?.presentToday ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Late</span>
                <Badge variant="warning">{stats?.lateToday ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Absent</span>
                <Badge variant="destructive">{stats?.absentToday ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">On Leave</span>
                <Badge variant="info">{stats?.onLeave ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
