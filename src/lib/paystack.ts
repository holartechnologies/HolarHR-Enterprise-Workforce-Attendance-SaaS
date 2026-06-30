const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const MOCK = process.env.PAYSTACK_MOCK === "true";
const BASE = "https://api.paystack.co";

function mockRef() {
  return `MOCK_REF_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function api(method: string, path: string, body?: unknown) {
  if (!PAYSTACK_SECRET && !MOCK) throw new Error("Paystack not configured. Set PAYSTACK_SECRET_KEY or PAYSTACK_MOCK=true");
  if (MOCK) {
    throw new Error("Mock mode — real API should not be called");
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Paystack API error");
  return json.data;
}

export async function createPlan(params: {
  name: string;
  amount: number;
  interval: string;
  description?: string;
}) {
  if (MOCK) {
    const code = `PLN_mock_${params.name.toLowerCase().replace(/\s+/g, "_")}`;
    return { plan_code: code, name: params.name, amount: params.amount * 100 };
  }
  return api("POST", "/plan", {
    name: params.name,
    amount: params.amount * 100,
    interval: params.interval,
    description: params.description,
    currency: "NGN",
  });
}

export async function initializeTransaction(params: {
  email: string;
  amount: number;
  plan: string;
  metadata?: Record<string, string>;
}) {
  if (MOCK) {
    const ref = mockRef();
    const planSlug = params.plan.toLowerCase().replace(/^pln_mock_/, "");
    return {
      reference: ref,
      authorization_url: `http://localhost:3000/api/paystack-mock/authorize?reference=${ref}&plan=${params.plan}&companyId=${params.metadata?.companyId || ""}&planName=${params.metadata?.planName || ""}`,
      access_code: `mock_access_${ref}`,
    };
  }
  return api("POST", "/transaction/initialize", {
    email: params.email,
    amount: params.amount * 100,
    plan: params.plan,
    metadata: params.metadata,
    currency: "NGN",
  });
}

export async function verifyTransaction(reference: string) {
  if (MOCK) {
    return {
      status: "success",
      reference,
      amount: 9900,
      paid_at: new Date().toISOString(),
      customer: { email: "mock@example.com", customer_code: `CUS_mock_${reference}` },
      authorization: { authorization_url: "" },
    };
  }
  return api("GET", `/transaction/verify/${reference}`);
}

export async function listPlans() {
  if (MOCK) return [];
  return api("GET", "/plan");
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (MOCK) return true;
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) return false;
  const crypto = require("crypto");
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  return hash === signature;
}
