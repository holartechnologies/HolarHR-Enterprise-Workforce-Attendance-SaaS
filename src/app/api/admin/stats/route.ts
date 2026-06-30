import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPER_ADMIN") return unauthorized();

    const [totalCompanies, activeCompanies, inactiveCompanies, totalUsers, totalEmployees, totalAttendance, activeSubscriptions, plans] =
      await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { status: "ACTIVE" } }),
        prisma.company.count({ where: { status: "INACTIVE" } }),
        prisma.user.count(),
        prisma.employee.count(),
        prisma.attendance.count(),
        prisma.subscription.count({ where: { status: "ACTIVE" } }),
        prisma.plan.findMany({
          include: { _count: { select: { subscriptions: true } } },
        }),
      ]);

    return ok({
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      totalUsers,
      totalEmployees,
      totalAttendance,
      activeSubscriptions,
      planBreakdown: plans.map((p) => ({
        name: p.displayName,
        count: p._count.subscriptions,
        price: p.price,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
