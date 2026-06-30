import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "billing:view")) return unauthorized();

    const [plans, subscription] = await Promise.all([
      prisma.plan.findMany({ orderBy: { price: "asc" } }),
      prisma.subscription.findUnique({
        where: { companyId: user.companyId },
        include: { plan: true },
      }),
    ]);

    const usage = await Promise.all([
      prisma.employee.count({ where: { companyId: user.companyId } }),
      prisma.branch.count({ where: { companyId: user.companyId } }),
      prisma.department.count({ where: { companyId: user.companyId } }),
    ]);

    const isMock = process.env.PAYSTACK_MOCK === "true";
    return ok({
      plans: plans.map((p) => ({
        ...p,
        hasPaystack: isMock ? p.price > 0 : !!p.paystackPlanCode,
        hasStripe: !!p.stripePriceId,
      })),
      subscription,
      usage: {
        employees: usage[0],
        branches: usage[1],
        departments: usage[2],
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
