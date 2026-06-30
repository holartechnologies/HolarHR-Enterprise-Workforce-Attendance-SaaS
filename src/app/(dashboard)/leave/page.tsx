"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function LeavePage() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/leave");
    const d = await res.json();
    if (d.success) setRequests(d.data.items || d.data);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("type"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        reason: form.get("reason"),
      }),
    });
    const d = await res.json();
    if (d.success) { toast.success("Leave request submitted"); setShowAdd(false); load(); }
    else toast.error(d.error);
  }

  async function handleAction(id: string, status: string) {
    const res = await fetch("/api/leave", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const d = await res.json();
    if (d.success) { toast.success(d.message); load(); }
    else toast.error(d.error);
  }

  const statusBadge = (s: string) => {
    if (s === "APPROVED") return "success";
    if (s === "REJECTED") return "destructive";
    if (s === "PENDING") return "warning";
    return "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground">Manage time off requests</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-2" />New Request</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>New Leave Request</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <select name="type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" required>
                  <option value="ANNUAL">Annual</option>
                  <option value="SICK">Sick</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="MATERNITY">Maternity</option>
                  <option value="PATERNITY">Paternity</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Date</label>
                <Input name="startDate" type="date" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">End Date</label>
                <Input name="endDate" type="date" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Reason</label>
                <Input name="reason" placeholder="Reason for leave" />
              </div>
              <div className="md:col-span-2"><Button type="submit">Submit</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const emp = r.employee as { firstName?: string; lastName?: string };
                return (
                  <TableRow key={r.id as string}>
                    <TableCell className="font-medium">{emp?.firstName ?? ""} {emp?.lastName ?? ""}</TableCell>
                    <TableCell>{r.type as string}</TableCell>
                    <TableCell>{new Date(r.startDate as string).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(r.endDate as string).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.reason as string || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(r.status as string) as "success" | "destructive" | "warning" | "secondary"}>
                        {r.status as string}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleAction(r.id as string, "APPROVED")}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleAction(r.id as string, "REJECTED")}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No leave requests</p>
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
