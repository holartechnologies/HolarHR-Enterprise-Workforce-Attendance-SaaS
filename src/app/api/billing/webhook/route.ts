import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ok, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  if (!stripe) return badRequest("Stripe not configured");

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return badRequest("Missing signature");
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as Record<string, unknown>;
        const metadata = session.metadata as Record<string, string> | undefined;
        const companyId = metadata?.companyId;
        if (companyId) {
          await prisma.subscription.update({
            where: { companyId },
            data: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              status: "ACTIVE",
            },
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subEvent = event.data.object as unknown as Record<string, unknown>;
        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subEvent.id as string },
        });
        if (sub) {
          const status = subEvent.status as string;
          const periodStart = subEvent.current_period_start as number | undefined;
          const periodEnd = subEvent.current_period_end as number | undefined;
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: status === "active" ? "ACTIVE" : status === "past_due" ? "PAST_DUE" : "CANCELED",
              currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            },
          });
        }
        break;
      }
    }

    return ok({ received: true });
  } catch (err) {
    return badRequest(`Webhook Error: ${(err as Error).message}`);
  }
}
