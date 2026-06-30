"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Record<string, unknown>[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/shifts");
    const d = await res.json();
    if (d.success) setShifts(d.data);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        startTime: form.get("startTime"),
        endTime: form.get("endTime"),
        graceTime: parseInt(form.get("graceTime") as string) || 15,
      }),
    });
    const d = await res.json();
    if (d.success) { toast.success("Shift created"); setShowAdd(false); load(); }
    else toast.error(d.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shifts</h1>
          <p className="text-muted-foreground">Define working shifts and schedules</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-2" />Add Shift</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>New Shift</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-3">
              <Input name="name" placeholder="Shift name (e.g. Morning)" required />
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Start</label>
                <Input name="startTime" type="time" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">End</label>
                <Input name="endTime" type="time" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Grace (min)</label>
                <Input name="graceTime" type="number" defaultValue={15} />
              </div>
              <div><Button type="submit">Create</Button></div>
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
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Grace</TableHead>
                <TableHead>Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((s) => (
                <TableRow key={s.id as string}>
                  <TableCell className="font-medium">{s.name as string}</TableCell>
                  <TableCell>{s.startTime as string}</TableCell>
                  <TableCell>{s.endTime as string}</TableCell>
                  <TableCell>{Number(s.workingHours || 0).toFixed(1)}h</TableCell>
                  <TableCell>{s.graceTime as number} min</TableCell>
                  <TableCell>{(s._count as Record<string, number>).employees}</TableCell>
                </TableRow>
              ))}
              {shifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <CalendarClock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No shifts defined</p>
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
