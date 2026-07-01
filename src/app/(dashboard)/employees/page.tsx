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
  _count?: { deviceEnrollments: number };
}

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [shifts, setShifts] = useState<{ id: string; name: string }[]>([]);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [empDevices, setEmpDevices] = useState<Record<string, { id: string; device: { id: string; name: string } }[]>>({});
  const [enrolling, setEnrolling] = useState<Record<string, boolean>>({});
  const [regFingerprint, setRegFingerprint] = useState(false);

  useEffect(() => {
    loadEmployees();
    fetch("/api/departments").then(r => r.json()).then(d => d.success && setDepartments(d.data));
    fetch("/api/branches").then(r => r.json()).then(d => d.success && setBranches(d.data));
    fetch("/api/shifts").then(r => r.json()).then(d => d.success && setShifts(d.data));
    fetch("/api/devices").then(r => r.json()).then(d => d.success && setDevices(d.data));
  }, []);

  async function loadEmpDevices(empId: string) {
    const res = await fetch(`/api/employees/${empId}/devices`);
    const d = await res.json();
    if (d.success) setEmpDevices(prev => ({ ...prev, [empId]: d.data }));
  }

  async function enrollDevice(empId: string, deviceId: string) {
    setEnrolling(prev => ({ ...prev, [deviceId]: true }));
    const res = await fetch(`/api/employees/${empId}/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    const d = await res.json();
    setEnrolling(prev => ({ ...prev, [deviceId]: false }));
    if (d.success) { toast.success("Enrolled"); loadEmpDevices(empId); loadEmployees(); }
    else toast.error(d.error);
  }

  async function unenrollDevice(empId: string, deviceId: string) {
    if (!confirm("Remove this device enrollment?")) return;
    const res = await fetch(`/api/employees/${empId}/devices?deviceId=${deviceId}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) { toast.success("Unenrolled"); loadEmpDevices(empId); loadEmployees(); }
    else toast.error(d.error);
  }

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
      branchId: form.get("branchId") as string,
      shiftId: form.get("shiftId") as string,
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
      branchId: form.get("branchId") as string,
      shiftId: form.get("shiftId") as string,
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
              <select name="branchId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">No branch</option>
                {branches.filter(b => b.id).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select name="shiftId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">No shift</option>
                {shifts.filter(s => s.id).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
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
                <TableHead>Branch</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No employees yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  editing === emp.id ? (
                    <TableRow key={emp.id}>
                      <TableCell colSpan={10}>
                        <form onSubmit={(e) => handleEdit(emp.id, e)} className="grid gap-2 md:grid-cols-4">
                          <Input name="firstName" defaultValue={emp.firstName} required placeholder="First name" />
                          <Input name="lastName" defaultValue={emp.lastName} required placeholder="Last name" />
                          <Input name="email" type="email" defaultValue={emp.email || ""} placeholder="Email" />
                          <Input name="phone" defaultValue={emp.phone || ""} placeholder="Phone" />
                          <Input name="position" defaultValue={emp.position || ""} placeholder="Position" />
                          <select name="departmentId" defaultValue={emp.department?.id || ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">No department</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          <select name="branchId" defaultValue={emp.branch?.id || ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">No branch</option>
                            {branches.filter(b => b.id).map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                          <select name="shiftId" defaultValue={emp.shift?.id || ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">No shift</option>
                            {shifts.filter(s => s.id).map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-2 md:col-span-4">
                            <Button type="submit" size="sm">Save</Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="button" size="sm" variant="destructive" className="ml-auto text-white" onClick={() => remove(emp.id)}>Delete</Button>
                          </div>
                        </form>
                        <div className="mt-4 border-t pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">Biometric Devices</h4>
                            <Button type="button" size="sm" variant="outline" onClick={() => loadEmpDevices(emp.id)}>Refresh</Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(empDevices[emp.id] ?? []).map(ed => (
                              <div key={ed.id} className="flex items-center gap-1 rounded border px-2 py-1 text-xs">
                                <span>{ed.device.name}</span>
                                <button onClick={() => unenrollDevice(emp.id, ed.device.id)} className="text-destructive hover:text-destructive/80">&times;</button>
                              </div>
                            ))}
                            {(empDevices[emp.id] ?? []).length === 0 && (
                              <span className="text-xs text-muted-foreground">Not enrolled on any device</span>
                            )}
                          </div>
                          {devices.filter(d => !(empDevices[emp.id] ?? []).find(ed => ed.device.id === d.id)).length > 0 && (
                            <div className="mt-2">
                              <select
                                className="h-8 rounded border px-2 text-sm w-48"
                                defaultValue=""
                                onChange={e => { if (e.target.value) enrollDevice(emp.id, e.target.value); e.target.value = ""; }}
                              >
                                <option value="">Enroll on device...</option>
                                {devices.filter(d => !(empDevices[emp.id] ?? []).find(ed => ed.device.id === d.id)).map(d => (
                                  <option key={d.id} value={d.id} disabled={enrolling[d.id]}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs">{emp.employeeCode}</TableCell>
                      <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                      <TableCell>{emp.email || "-"}</TableCell>
                      <TableCell>{emp.position || "-"}</TableCell>
                      <TableCell>{emp.department?.name || "-"}</TableCell>
                      <TableCell>{emp.branch?.name || "-"}</TableCell>
                      <TableCell>{emp.shift?.name || "-"}</TableCell>
                      <TableCell>
                        <span className="text-xs">{ (emp._count?.deviceEnrollments ?? 0) > 0 ? `${emp._count!.deviceEnrollments} enrolled` : "None" }</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={emp.status === "ACTIVE" ? "success" : "secondary"}>
                          {emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(emp.id); loadEmpDevices(emp.id); }}>
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
