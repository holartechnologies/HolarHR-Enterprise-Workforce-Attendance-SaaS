"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  company: { name: string; slug: string } | null;
}

const roleColors: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  SUPER_ADMIN: "destructive",
  COMPANY_ADMIN: "success",
  HR_MANAGER: "warning",
  DEPARTMENT_MANAGER: "secondary",
  EMPLOYEE: "secondary",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => d.success && setUsers(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users</h1>
      <Card>
        <CardHeader><CardTitle className="text-gray-700">All Users</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No users found</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">{u.company?.name || "—"}</span>
                    <Badge variant={roleColors[u.role] || "secondary"}>{u.role}</Badge>
                    <Badge variant={u.isActive ? "success" : "warning"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
