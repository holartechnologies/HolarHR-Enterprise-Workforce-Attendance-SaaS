import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, badRequest, ok, serverError } from "@/lib/api-utils";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { planId } = await req.json();
    if (!planId) return badRequest("Plan ID required");

    const plan = await prisma.plan.findUnique({ where: { name: planId } });
    if (!plan || !plan.stripePriceId) return badRequest("Invalid plan");

    const company = await prisma.company.findUnique({ where: { id: user.companyId } });
    if (!company) return badRequest("Company not found");

    const subscription = await prisma.subscription.findUnique({ where: { companyId: user.companyId } });

    let customerId = subscription?.stripeCustomerId;

    const session = await createCheckoutSession({
      customerId,
      priceId: plan.stripePriceId,
      companyId: user.companyId,
      email: user.email,
      companyName: company.name,
    });

    if (subscription && !customerId) {
      await prisma.subscription.update({
        where: { companyId: user.companyId },
        data: { stripeCustomerId: session.customer as string },
      });
    }

    return ok({ url: session.url });
  } catch (error) {
    return serverError(error);
  }
}
