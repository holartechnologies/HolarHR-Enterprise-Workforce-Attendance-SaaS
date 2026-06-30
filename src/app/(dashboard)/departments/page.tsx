"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Record<string, unknown>[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/departments");
    const d = await res.json();
    if (d.success) setDepartments(d.data);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), description: form.get("description") }),
    });
    const d = await res.json();
    if (d.success) { toast.success("Department created"); setShowAdd(false); load(); }
    else toast.error(d.error);
  }

  async function handleEdit(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/departments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), description: form.get("description") }),
    });
    const d = await res.json();
    if (d.success) { toast.success("Department updated"); setEditing(null); load(); }
    else toast.error(d.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this department?")) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) { toast.success("Department deleted"); load(); }
    else toast.error(d.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Organize your departments</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-2" />Add Department</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>New Department</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-4">
              <Input name="name" placeholder="Department name" required />
              <Input name="description" placeholder="Description (optional)" />
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id as string}>
                  {editing === d.id ? (
                    <>
                      <TableCell colSpan={3}>
                        <form onSubmit={(e) => handleEdit(d.id as string, e)} className="flex gap-2">
                          <Input name="name" defaultValue={d.name as string} required />
                          <Input name="description" defaultValue={d.description as string || ""} placeholder="Description" />
                          <Button type="submit" size="sm">Save</Button>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                        </form>
                      </TableCell>
                      <TableCell />
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{d.name as string}</TableCell>
                      <TableCell>{d.description as string || "-"}</TableCell>
                      <TableCell>{(d._count as Record<string, number>).employees}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(d.id as string)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id as string)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No departments yet</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
