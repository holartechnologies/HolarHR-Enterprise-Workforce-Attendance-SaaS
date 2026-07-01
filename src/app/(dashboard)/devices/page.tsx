"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Monitor, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Record<string, unknown>[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  useEffect(() => { load(); fetch("/api/branches").then(r => r.json()).then(d => d.success && setBranches(d.data)); }, []);

  async function load() {
    const res = await fetch("/api/devices");
    const d = await res.json();
    if (d.success) setDevices(d.data);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        model: form.get("model"),
        serialNumber: form.get("serialNumber"),
        ipAddress: form.get("ipAddress"),
        port: form.get("port") ? Number(form.get("port")) : 4370,
        location: form.get("location"),
        branchId: form.get("branchId") || null,
      }),
    });
    const d = await res.json();
    if (d.success) { toast.success("Device added"); setShowAdd(false); load(); }
    else toast.error(d.error);
  }

  function startEdit(device: Record<string, unknown>) {
    setEditingId(device.id as string);
    setEditData({
      name: device.name,
      model: device.model || "",
      serialNumber: device.serialNumber || "",
      ipAddress: device.ipAddress || "",
      port: device.port ?? 4370,
      location: device.location || "",
      branchId: device.branchId || "",
      status: device.status || "online",
    });
  }

  function cancelEdit() { setEditingId(null); setEditData({}); }

  async function handleEdit(deviceId: string) {
    const body: Record<string, unknown> = {};
    if (editData.name) body.name = editData.name;
    body.model = editData.model || null;
    body.serialNumber = editData.serialNumber || null;
    body.ipAddress = editData.ipAddress || null;
    body.port = editData.port ? Number(editData.port) : null;
    body.location = editData.location || null;
    body.branchId = editData.branchId || null;
    if (editData.status) body.status = editData.status;

    const res = await fetch(`/api/devices/${deviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (d.success) { toast.success("Device updated"); setEditingId(null); load(); }
    else toast.error(d.error);
  }

  async function handleDelete(deviceId: string) {
    if (!confirm("Delete this device? Employee enrollments will also be removed.")) return;
    const res = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) { toast.success("Device deleted"); load(); }
    else toast.error(d.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biometric Devices</h1>
          <p className="text-muted-foreground">Manage fingerprint and biometric devices</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-2" />Add Device</Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle>New Biometric Device</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-3">
              <Input name="name" placeholder="Device name" required />
              <Input name="model" placeholder="Model (e.g. ZKTeco uFace 800)" />
              <Input name="serialNumber" placeholder="Serial number" />
              <Input name="ipAddress" placeholder="IP address" />
              <Input name="port" type="number" placeholder="Port" defaultValue="4370" />
              <Input name="location" placeholder="Physical location" />
              <select name="branchId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">No branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="md:col-span-3"><Button type="submit">Add Device</Button></div>
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
                <TableHead>Model / IP</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.id as string}>
                  {editingId === d.id ? (
                    <>
                      <TableCell><Input value={editData.name as string} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-8" /></TableCell>
                      <TableCell className="space-y-1">
                        <Input value={editData.model as string} onChange={e => setEditData({ ...editData, model: e.target.value })} placeholder="Model" className="h-8" />
                        <Input value={editData.ipAddress as string} onChange={e => setEditData({ ...editData, ipAddress: e.target.value })} placeholder="IP" className="h-8" />
                      </TableCell>
                      <TableCell>
                        <select value={editData.branchId as string} onChange={e => setEditData({ ...editData, branchId: e.target.value })} className="h-8 rounded border px-2 text-sm w-full">
                          <option value="">No branch</option>
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>{String((d._count as Record<string, number>)?.employeeDevices ?? 0)}</TableCell>
                      <TableCell>
                        <select value={editData.status as string} onChange={e => setEditData({ ...editData, status: e.target.value })} className="h-8 rounded border px-2 text-sm">
                          <option value="online">Online</option>
                          <option value="offline">Offline</option>
                          <option value="error">Error</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(d.id as string)} title="Save"><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel"><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{d.name as string}</TableCell>
                      <TableCell className="text-xs">
                        <div>{d.model as string || "-"}</div>
                        <div className="text-muted-foreground">{d.ipAddress as string ? `${d.ipAddress}:${d.port}` : ""}</div>
                      </TableCell>
                      <TableCell>{(d.branch as Record<string, string>)?.name || "-"}</TableCell>
                      <TableCell>{String((d._count as Record<string, number>)?.employeeDevices ?? 0)}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "online" ? "success" : d.status === "offline" ? "secondary" : "destructive"}>
                          {d.status as string}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(d)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id as string)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {devices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Monitor className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No devices added yet</p>
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
