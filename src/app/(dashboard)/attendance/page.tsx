"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Play, Square, Coffee } from "lucide-react";
import toast from "react-hot-toast";

export default function AttendancePage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/attendance/status")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setClockedIn(!!d.data?.clockedIn);
          setOnBreak(!!d.data?.onBreak);
        }
      })
      .catch(() => {});
  }, []);

  async function handleAction(type: string, earlyClockoutReason?: string) {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: session?.user?.employeeId,
        type,
        earlyClockoutReason,
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(data.message);
      if (type === "clock_in") setClockedIn(true);
      if (type === "clock_out") setClockedIn(false);
      if (type === "break_start") setOnBreak(true);
      if (type === "break_end") setOnBreak(false);
    } else {
      if (data.error?.includes("before your shift ends")) {
        setPendingAction(type);
        setShowReason(true);
      } else {
        toast.error(data.error);
      }
    }
  }

  async function submitReason(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const reason = form.get("reason") as string;
    if (!reason) { toast.error("Please provide a reason"); return; }
    setShowReason(false);
    if (pendingAction) await handleAction(pendingAction, reason);
    setPendingAction(null);
  }

  useEffect(() => {
    fetch("/api/attendance?perPage=10")
      .then(r => r.json())
      .then(d => d.success && setRecords(d.data.items || d.data))
      .catch(() => {});
  }, [clockedIn]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Clock in/out and view attendance records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time Tracking</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold tabular-nums">
              {currentTime?.toLocaleTimeString() ?? ""}
            </div>
            <p className="text-muted-foreground">
              {currentTime?.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) ?? ""}
            </p>
            <div className="flex justify-center gap-2">
              {!clockedIn ? (
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleAction("clock_in")}>
                  <Play className="h-4 w-4 mr-2" />
                  Clock In
                </Button>
              ) : (
                <>
                  {!onBreak ? (
                    <Button variant="secondary" size="lg" onClick={() => handleAction("break_start")}>
                      <Coffee className="h-4 w-4 mr-2" />
                      Start Break
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" onClick={() => handleAction("break_end")}>
                      <Coffee className="h-4 w-4 mr-2" />
                      End Break
                    </Button>
                  )}
                  <Button variant="destructive" size="lg" onClick={() => handleAction("clock_out")}>
                    <Square className="h-4 w-4 mr-2" />
                    Clock Out
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {clockedIn ? (onBreak ? "On Break" : "Clocked In") : "Not Clocked In"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showReason && (
        <Card>
          <CardHeader><CardTitle>Early Clock-out Reason</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitReason} className="flex gap-2">
              <Input name="reason" placeholder="Why are you clocking out early?" required autoFocus />
              <Button type="submit">Submit</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowReason(false); setPendingAction(null); }}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: Record<string, unknown>) => (
                <TableRow key={r.id as string}>
                  <TableCell>{new Date(r.date as string).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{r.employeeName as string}</TableCell>
                  <TableCell>{r.clockIn ? new Date(r.clockIn as string).toLocaleTimeString() : "-"}</TableCell>
                  <TableCell>{r.clockOut ? new Date(r.clockOut as string).toLocaleTimeString() : "-"}</TableCell>
                  <TableCell>{r.totalHours ? `${Number(r.totalHours).toFixed(1)}h` : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={
                      r.status === "PRESENT" ? "success" :
                      r.status === "LATE" ? "warning" : "destructive"
                    }>
                      {r.status as string}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No attendance records found
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
