import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";
import { createPlan, listPlans } from "@/lib/paystack";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const paystackPlans = await listPlans();
    return ok(paystackPlans);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const dbPlans = await prisma.plan.findMany({
      where: { price: { gt: 0 } },
    });

    const results: { name: string; planCode: string | null; error?: string }[] = [];

    for (const plan of dbPlans) {
      try {
        const created = await createPlan({
          name: plan.displayName,
          amount: plan.price,
          interval: "monthly",
          description: plan.description || undefined,
        });

        await prisma.plan.update({
          where: { id: plan.id },
          data: { paystackPlanCode: created.plan_code },
        });

        results.push({ name: plan.displayName, planCode: created.plan_code });
      } catch (e) {
        results.push({ name: plan.displayName, planCode: null, error: (e as Error).message });
      }
    }

    return ok(results);
  } catch (error) {
    return serverError(error);
  }
}
