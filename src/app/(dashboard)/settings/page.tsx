"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [company, setCompany] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => d.success && setCompany(d.data))
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      address: form.get("address"),
      website: form.get("website"),
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (d.success) toast.success("Settings saved");
      else toast.error(d.error);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const counts = (company?._count as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your company settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Employees</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{counts.employees || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Departments</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{counts.departments || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Branches</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{counts.branches || 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input name="name" defaultValue={company?.name as string || ""} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" defaultValue={company?.email as string || ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" defaultValue={company?.phone as string || ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input name="website" defaultValue={company?.website as string || ""} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <Input name="address" defaultValue={company?.address as string || ""} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Company Logo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-lg border flex items-center justify-center overflow-hidden bg-muted">
              {company?.logo ? (
                <img src={company.logo as string} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{(company?.name as string)?.[0] || "?"}</span>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Upload a logo for your company (PNG, JPG, SVG, max 400KB)</p>
              <p className="text-xs text-muted-foreground/60">Recommended: 200x200px or larger, square aspect ratio</p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const form = new FormData();
                    form.append("logo", file);
                    const res = await fetch("/api/settings/logo", { method: "POST", body: form });
                    const d = await res.json();
                    if (d.success) { toast.success("Logo uploaded"); setCompany(prev => prev ? { ...prev, logo: d.data.logo } : prev); }
                    else toast.error(d.error);
                  }}
                />
                <span className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Choose File</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Plan Details</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge>{(company?.plan as Record<string, string>)?.displayName || "Free"}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="success">{company?.subscription ? (company.subscription as Record<string, string>).status : "Active"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
