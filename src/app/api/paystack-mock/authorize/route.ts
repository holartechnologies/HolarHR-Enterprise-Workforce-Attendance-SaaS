import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const planCode = searchParams.get("plan");
  const companyId = searchParams.get("companyId");
  const planName = searchParams.get("planName");

  if (!companyId || !planCode) {
    return NextResponse.redirect(new URL("/billing?error=missing_params", req.url));
  }

  const plan = planName
    ? await prisma.plan.findUnique({ where: { name: planName as never } })
    : await prisma.plan.findFirst({ where: { paystackPlanCode: planCode } });

  if (!plan) {
    return NextResponse.redirect(new URL("/billing?error=plan_not_found", req.url));
  }

  await prisma.subscription.upsert({
    where: { companyId },
    create: {
      companyId,
      planId: plan.id,
      status: "ACTIVE",
      paystackCustomerId: `CUS_mock_${companyId.slice(0, 8)}`,
      paystackSubscriptionId: `SUB_mock_${Date.now()}`,
      authorizationUrl: req.url,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      paystackCustomerId: `CUS_mock_${companyId.slice(0, 8)}`,
      paystackSubscriptionId: `SUB_mock_${Date.now()}`,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
  });

  return NextResponse.redirect(new URL("/billing?success=true", req.url));
}
