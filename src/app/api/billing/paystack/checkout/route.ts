import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest, ok, serverError } from "@/lib/api-utils";
import { initializeTransaction } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { planId } = await req.json();
    if (!planId) return badRequest("Plan ID required");

    const plan = await prisma.plan.findUnique({ where: { name: planId } });
    if (!plan) return badRequest("Invalid plan");

    const isMock = process.env.PAYSTACK_MOCK === "true";
    const planCode = plan.paystackPlanCode || (isMock ? `PLN_mock_${plan.name.toLowerCase()}` : null);
    if (!planCode) return badRequest("Paystack not configured for this plan");

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) return badRequest("Company not found");

    const sub = await prisma.subscription.findUnique({ where: { companyId: user.companyId } });

    const tx = await initializeTransaction({
      email: user.email,
      amount: plan.price,
      plan: planCode,
      metadata: { companyId: user.companyId, planName: plan.name },
    });

    if (sub) {
      await prisma.subscription.update({
        where: { companyId: user.companyId },
        data: { authorizationUrl: tx.authorization_url },
      });
    }

    return ok({ url: tx.authorization_url });
  } catch (error) {
    return serverError(error);
  }
}
