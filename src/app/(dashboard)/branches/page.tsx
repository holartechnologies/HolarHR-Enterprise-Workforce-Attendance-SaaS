"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, GitBranch, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Record<string, unknown>[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/branches");
    const d = await res.json();
    if (d.success) setBranches(d.data);
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const lat = form.get("latitude") as string;
    const lng = form.get("longitude") as string;
    const body: Record<string, unknown> = {
      name: form.get("name"),
      address: form.get("address"),
      phone: form.get("phone"),
      email: form.get("email"),
      radius: form.get("radius") ? Number(form.get("radius")) : 100,
    };
    if (lat) body.latitude = parseFloat(lat);
    if (lng) body.longitude = parseFloat(lng);
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (d.success) { toast.success("Branch created"); setShowAdd(false); load(); }
    else toast.error(d.error);
  }

  function startEdit(branch: Record<string, unknown>) {
    setEditingId(branch.id as string);
    setEditData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      latitude: branch.latitude != null ? String(branch.latitude) : "",
      longitude: branch.longitude != null ? String(branch.longitude) : "",
      radius: branch.radius ?? 100,
      isActive: branch.isActive,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  async function handleEdit(branchId: string) {
    const body: Record<string, unknown> = {};
    if (editData.name) body.name = editData.name;
    body.address = editData.address || null;
    body.phone = editData.phone || null;
    body.email = editData.email || null;
    body.latitude = editData.latitude ? parseFloat(editData.latitude as string) : null;
    body.longitude = editData.longitude ? parseFloat(editData.longitude as string) : null;
    body.radius = editData.radius ? Number(editData.radius) : null;
    body.isActive = editData.isActive;

    const res = await fetch(`/api/branches/${branchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (d.success) { toast.success("Branch updated"); setEditingId(null); load(); }
    else toast.error(d.error);
  }

  async function handleDelete(branchId: string) {
    if (!confirm("Delete this branch? Employees assigned will need reassignment.")) return;
    const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) { toast.success("Branch deleted"); load(); }
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
              <Input name="phone" placeholder="Phone" />
              <Input name="email" type="email" placeholder="Email" />
              <Input name="latitude" type="number" step="any" placeholder="Latitude (e.g. 6.5244)" />
              <Input name="longitude" type="number" step="any" placeholder="Longitude (e.g. 3.3792)" />
              <Input name="radius" type="number" placeholder="Geofence radius (meters)" defaultValue="100" />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">Create</Button>
                <Button type="button" variant="outline" onClick={() => {
                  if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const formEl = document.forms[0];
                        (formEl.elements.namedItem("latitude") as HTMLInputElement).value = String(pos.coords.latitude);
                        (formEl.elements.namedItem("longitude") as HTMLInputElement).value = String(pos.coords.longitude);
                      },
                      () => toast.error("Could not get location")
                    );
                  }
                }}>Use My Location</Button>
              </div>
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
                <TableHead>GPS Geofence</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => (
                <TableRow key={b.id as string}>
                  {editingId === b.id ? (
                    <>
                      <TableCell>
                        <Input value={editData.name as string} onChange={e => setEditData({ ...editData, name: e.target.value })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Input value={editData.address as string} onChange={e => setEditData({ ...editData, address: e.target.value })} className="h-8" />
                      </TableCell>
                      <TableCell className="space-y-1">
                        <Input value={editData.latitude as string} onChange={e => setEditData({ ...editData, latitude: e.target.value })} placeholder="Lat" className="h-8 w-24" />
                        <Input value={editData.longitude as string} onChange={e => setEditData({ ...editData, longitude: e.target.value })} placeholder="Lng" className="h-8 w-24" />
                        <Input value={editData.radius as string} onChange={e => setEditData({ ...editData, radius: e.target.value })} placeholder="Radius m" type="number" className="h-8 w-24" />
                      </TableCell>
                      <TableCell>{(b._count as Record<string, number>).employees}</TableCell>
                      <TableCell>
                        <select
                          value={editData.isActive ? "true" : "false"}
                          onChange={e => setEditData({ ...editData, isActive: e.target.value === "true" })}
                          className="h-8 rounded border px-2 text-sm"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(b.id as string)} title="Save"><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit} title="Cancel"><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{b.name as string}</TableCell>
                      <TableCell>{b.address as string || "-"}</TableCell>
                      <TableCell>
                        {b.latitude && b.longitude ? (
                          <span className="text-xs text-muted-foreground">
                            {Number(b.latitude).toFixed(4)}, {Number(b.longitude).toFixed(4)}
                            <br />±{b.radius as number}m
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>{(b._count as Record<string, number>).employees}</TableCell>
                      <TableCell>
                        <Badge variant={b.isActive as boolean ? "success" : "secondary"}>
                          {b.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(b)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id as string)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
              {branches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
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
