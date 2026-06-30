"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  status: string;
  lastActivityAt: string | null;
  createdAt: string;
  plan: { id: string; displayName: string; name: string } | null;
  subscription: { status: string } | null;
  _count: { users: number; employees: number };
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<{ id: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    load();
    fetch("/api/billing").then(r => r.json()).then(d => d.success && setPlans(d.data.plans)).catch(() => {});
  }, []);

  async function load() {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((d) => d.success && setTenants(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleEdit(tenant: Tenant, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: tenant.id,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        address: form.get("address"),
        website: form.get("website"),
        status: form.get("status"),
        planId: form.get("planId") || undefined,
      }),
    });
    const d = await res.json();
    if (d.success) { toast.success("Company updated"); setEditing(null); load(); }
    else toast.error(d.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this company permanently? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/tenants?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const d = await res.json();
    if (d.success) { toast.success("Company deleted"); load(); }
    else toast.error(d.error);
  }

  function statusBadge(status: string) {
    const map: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
      ACTIVE: "success", INACTIVE: "warning", CLOSED: "destructive",
    };
    return <Badge variant={map[status] || "secondary"}>{status}</Badge>;
  }

  function daysSince(date: string | null): string {
    if (!date) return "Never";
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff} days ago`;
  }

  function daysSinceCreated(date: string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    return `${diff} days`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tenants</h1>
      <Card>
        <CardHeader><CardTitle className="text-gray-700">All Companies</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : tenants.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No tenants yet</div>
            ) : (
              tenants.map((t) => (
                editing === t.id ? (
                  <div key={t.id} className="p-4 border-b">
                    <form onSubmit={(e) => handleEdit(t, e)} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <Input name="name" defaultValue={t.name} required />
                      <Input name="email" defaultValue={t.email || ""} placeholder="Email" />
                      <Input name="phone" defaultValue={t.phone || ""} placeholder="Phone" />
                      <Input name="website" defaultValue={t.website || ""} placeholder="Website" />
                      <Input name="address" defaultValue={t.address || ""} placeholder="Address" className="md:col-span-2 lg:col-span-4" />
                      <select name="status" defaultValue={t.status} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                      <select name="planId" defaultValue={t.plan?.id || ""} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                        <option value="">No plan</option>
                        {plans.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                      </select>
                      <div className="flex gap-2 md:col-span-2 lg:col-span-4">
                        <Button type="submit" size="sm">Save</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div key={t.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Building2 className="h-8 w-8 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{t.name}</p>
                        <p className="text-sm text-gray-500 truncate">{t.slug} &middot; {t.email || "—"}</p>
                        <p className="text-xs text-gray-400">
                          Joined {daysSinceCreated(t.createdAt)} ago &middot; Last activity {daysSince(t.lastActivityAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 shrink-0">
                      <div className="hidden md:block text-right">
                        <p>{t._count.employees} employees</p>
                        <p>{t._count.users} users</p>
                      </div>
                      <div className="hidden md:block text-right">
                        <Badge variant={t.subscription?.status === "ACTIVE" ? "success" : "warning"}>
                          {t.plan?.displayName || "No plan"}
                        </Badge>
                      </div>
                      {statusBadge(t.status)}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(t.id)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                    </div>
                  </div>
                )
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
