"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Pencil, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  status: string;
  department: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  shift: { id: string; name: string } | null;
}

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadEmployees();
    fetch("/api/departments").then(r => r.json()).then(d => d.success && setDepartments(d.data));
  }, []);

  async function loadEmployees() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();
      if (data.success) setEmployees(data.data.items || data.data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      firstName: form.get("firstName") as string,
      lastName: form.get("lastName") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      position: form.get("position") as string,
      departmentId: form.get("departmentId") as string,
    };

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      const msg = result.data?.tempPassword
        ? `Employee added — temp password: ${result.data.tempPassword}`
        : "Employee added";
      toast.success(msg, { duration: 8000 });
      setShowAdd(false);
      loadEmployees();
    } else {
      toast.error(result.error);
    }
  }

  async function handleEdit(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
      firstName: form.get("firstName") as string,
      lastName: form.get("lastName") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      position: form.get("position") as string,
      departmentId: form.get("departmentId") as string,
    };

    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      toast.success("Employee updated");
      setEditing(null);
      loadEmployees();
    } else {
      toast.error(result.error);
    }
  }

  async function deactivate(id: string) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INACTIVE" }),
    });
    const result = await res.json();
    if (result.success) { toast.success("Employee deactivated"); loadEmployees(); }
  }

  async function reactivate(id: string) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    const result = await res.json();
    if (result.success) { toast.success("Employee reactivated"); loadEmployees(); }
  }

  async function resetPassword(id: string) {
    if (!confirm("Reset this employee's password? They will receive a new temporary password.")) return;
    const res = await fetch(`/api/employees/${id}/reset-password`, { method: "POST" });
    const result = await res.json();
    if (result.success) toast.success(`Password reset — temp password: ${result.data.tempPassword}`, { duration: 10000 });
    else toast.error(result.error);
  }

  async function remove(id: string) {
    if (!confirm("Delete this employee permanently?")) return;
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) { toast.success("Employee deleted"); loadEmployees(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your workforce</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>Add New Employee</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
              <Input name="firstName" placeholder="First name" required />
              <Input name="lastName" placeholder="Last name" required />
              <Input name="email" type="email" placeholder="Email" />
              <Input name="phone" placeholder="Phone" />
              <Input name="position" placeholder="Position" />
              <select name="departmentId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">No department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="md:col-span-2">
                <Button type="submit">Save Employee</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadEmployees()}
          />
        </div>
        <Button variant="outline" onClick={loadEmployees}>Search</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No employees yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  editing === emp.id ? (
                    <TableRow key={emp.id}>
                      <TableCell colSpan={7}>
                        <form onSubmit={(e) => handleEdit(emp.id, e)} className="grid gap-2 md:grid-cols-6">
                          <Input name="firstName" defaultValue={emp.firstName} required />
                          <Input name="lastName" defaultValue={emp.lastName} required />
                          <Input name="email" type="email" defaultValue={emp.email || ""} />
                          <Input name="phone" defaultValue={emp.phone || ""} />
                          <Input name="position" defaultValue={emp.position || ""} />
                          <select name="departmentId" defaultValue={emp.department?.id || ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">No department</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-2 md:col-span-6">
                            <Button type="submit" size="sm">Save</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="button" size="sm" variant="destructive" className="ml-auto text-white" onClick={() => remove(emp.id)}>Delete</Button>
                          </div>
                        </form>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs">{emp.employeeCode}</TableCell>
                      <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                      <TableCell>{emp.email || "-"}</TableCell>
                      <TableCell>{emp.position || "-"}</TableCell>
                      <TableCell>{emp.department?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={emp.status === "ACTIVE" ? "success" : "secondary"}>
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(emp.id)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {emp.status === "ACTIVE" ? (
                            <Button variant="ghost" size="sm" onClick={() => deactivate(emp.id)}>
                              Deactivate
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => reactivate(emp.id)}>
                              Reactivate
                            </Button>
                          )}
                          {["COMPANY_ADMIN", "HR_MANAGER"].includes(session?.user?.role || "") && emp.email && (
                            <Button variant="ghost" size="sm" onClick={() => resetPassword(emp.id)} title="Reset password">
                              <KeyRound className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
