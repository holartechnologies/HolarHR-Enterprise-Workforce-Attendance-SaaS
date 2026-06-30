"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  maxEmployees: number;
  maxBranches: number;
  qrAttendance: boolean;
  gpsAttendance: boolean;
  aiFeatures: boolean;
  apiAccess: boolean;
  hasStripe: boolean;
  hasPaystack: boolean;
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPlans(d.data.plans);
          setSubscription(d.data.subscription);
          setUsage(d.data.usage);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout(planId: string, provider: "stripe" | "paystack") {
    const key = `${planId}_${provider}`;
    setCheckoutLoading(key);
    try {
      const endpoint = provider === "paystack" ? "/api/billing/paystack/checkout" : "/api/billing/checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const d = await res.json();
      if (d.success && d.data.url) {
        window.location.href = d.data.url;
      } else {
        toast.error(d.error || "Checkout failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const currentPlanName = subscription?.plan ? (subscription.plan as Record<string, string>).name : "FREE";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              You are on the <strong>{(subscription.plan as Record<string, string>)?.displayName || "Free"}</strong>{" "}
              plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={subscription.status === "ACTIVE" ? "success" : "warning"}>
                  {subscription.status as string}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Usage</p>
                <p className="text-sm">
                  {usage.employees ?? 0} employees / {usage.branches ?? 0} branches
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = currentPlanName === plan.name;
          const features = [
            {
              label: `${plan.maxEmployees === 99999 ? "Unlimited" : plan.maxEmployees} employees`,
              included: true,
            },
            {
              label: `${plan.maxBranches === 999 ? "Unlimited" : plan.maxBranches} branches`,
              included: true,
            },
            { label: "QR Attendance", included: plan.qrAttendance },
            { label: "GPS Attendance", included: plan.gpsAttendance },
            { label: "AI Features", included: plan.aiFeatures },
            { label: "API Access", included: plan.apiAccess },
          ];

          return (
            <Card key={plan.name} className={isCurrent ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{plan.displayName}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="h-4 w-4 block" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground line-through"}>{f.label}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {plan.hasStripe && (
                        <Button
                          className="w-full"
                          onClick={() => handleCheckout(plan.name, "stripe")}
                          disabled={checkoutLoading === `${plan.name}_stripe`}
                        >
                          {checkoutLoading === `${plan.name}_stripe` ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Pay with Card
                        </Button>
                      )}
                      {plan.hasPaystack && (
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={() => handleCheckout(plan.name, "paystack")}
                          disabled={checkoutLoading === `${plan.name}_paystack`}
                        >
                          {checkoutLoading === `${plan.name}_paystack` ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <span className="mr-2">&#8358;</span>
                          )}
                          Pay with Paystack
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
