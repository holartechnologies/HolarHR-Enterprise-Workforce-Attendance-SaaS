import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import { ok, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature || !process.env.PAYSTACK_WEBHOOK_SECRET) {
    return badRequest("Missing signature");
  }

  if (!verifyWebhookSignature(body, signature)) {
    return badRequest("Invalid signature");
  }

  try {
    const event = JSON.parse(body);

    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const metadata = data.metadata || {};
        const companyId = metadata.companyId;

        if (companyId) {
          const customerEmail = data.customer?.email;
          const customerCode = data.customer?.customer_code;

          await prisma.subscription.upsert({
            where: { companyId },
            create: {
              companyId,
              planId: "",
              status: "ACTIVE",
              paystackCustomerId: customerCode,
              authorizationUrl: data.authorization?.authorization_url,
            },
            update: {
              status: "ACTIVE",
              paystackCustomerId: customerCode,
              authorizationUrl: data.authorization?.authorization_url,
            },
          });
        }
        break;
      }

      case "subscription.create": {
        const subData = event.data;
        const customerCode = subData.customer?.customer_code;

        if (customerCode) {
          const sub = await prisma.subscription.findFirst({
            where: { paystackCustomerId: customerCode },
          });

          if (sub) {
            const planCode = subData.plan?.plan_code;
            const plan = planCode
              ? await prisma.plan.findFirst({ where: { paystackPlanCode: planCode } })
              : null;

            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                paystackSubscriptionId: subData.subscription_code,
                status: "ACTIVE",
                planId: plan?.id || sub.planId,
                currentPeriodStart: subData.createdAt ? new Date(subData.createdAt) : undefined,
                currentPeriodEnd: subData.next_payment_date
                  ? new Date(subData.next_payment_date)
                  : undefined,
              },
            });
          }
        }
        break;
      }

      case "subscription.disable": {
        const subData = event.data;
        const sub = await prisma.subscription.findFirst({
          where: { paystackSubscriptionId: subData.subscription_code },
        });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "CANCELED" },
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
