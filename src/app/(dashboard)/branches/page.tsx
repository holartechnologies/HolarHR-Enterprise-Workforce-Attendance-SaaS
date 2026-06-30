"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, GitBranch } from "lucide-react";
import toast from "react-hot-toast";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Record<string, unknown>[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/branches");
    const d = await res.json();
    if (d.success) setBranches(d.data);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), address: form.get("address") }),
    });
    const d = await res.json();
    if (d.success) { toast.success("Branch created"); setShowAdd(false); load(); }
    else toast.error(d.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">Manage your branches and locations</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-2" />Add Branch</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>New Branch</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
              <Input name="name" placeholder="Branch name" required />
              <Input name="address" placeholder="Address" />
              <div className="md:col-span-2"><Button type="submit">Create</Button></div>
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
                <TableHead>Address</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id as string}>
                  <TableCell className="font-medium">{b.name as string}</TableCell>
                  <TableCell>{b.address as string || "-"}</TableCell>
                  <TableCell>{(b._count as Record<string, number>).employees}</TableCell>
                  <TableCell>
                    <Badge variant={b.isActive as boolean ? "success" : "secondary"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {branches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No branches yet</p>
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
