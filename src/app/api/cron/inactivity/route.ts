import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/api-utils";

export async function GET() {
  try {
    const now = new Date();
    const results: string[] = [];

    const companies = await prisma.company.findMany({
      include: {
        users: { where: { role: "COMPANY_ADMIN" }, select: { email: true, firstName: true } },
      },
    });

    for (const company of companies) {
      const lastActive = company.lastActivityAt || company.createdAt;
      const monthsSince = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24 * 30);

      if (monthsSince >= 12 && company.status !== "CLOSED") {
        // 12+ months: delete permanently
        const adminEmails = company.users.map((u) => u.email).filter(Boolean);
        await prisma.$transaction([
          prisma.notification.deleteMany({ where: { companyId: company.id } }),
          prisma.auditLog.deleteMany({ where: { companyId: company.id } }),
          prisma.break.deleteMany({ where: { attendance: { companyId: company.id } } }),
          prisma.attendance.deleteMany({ where: { companyId: company.id } }),
          prisma.leaveRequest.deleteMany({ where: { companyId: company.id } }),
          prisma.apiKey.deleteMany({ where: { companyId: company.id } }),
          prisma.user.deleteMany({ where: { companyId: company.id } }),
          prisma.employee.deleteMany({ where: { companyId: company.id } }),
          prisma.shift.deleteMany({ where: { companyId: company.id } }),
          prisma.branch.deleteMany({ where: { companyId: company.id } }),
          prisma.department.deleteMany({ where: { companyId: company.id } }),
          prisma.subscription.deleteMany({ where: { companyId: company.id } }),
          prisma.company.delete({ where: { id: company.id } }),
        ]);
        results.push(`DELETED ${company.name} (${company.slug}) — 12+ months inactive. Notified: ${adminEmails.join(", ")}`);
      } else if (monthsSince >= 9 && company.status !== "CLOSED") {
        // 9+ months: second deletion warning
        await prisma.company.update({ where: { id: company.id }, data: { status: "INACTIVE" } });
        results.push(`WARNING 2 ${company.name} (${company.slug}) — 9+ months inactive. Second deletion notice sent.`);
      } else if (monthsSince >= 6 && company.status !== "CLOSED") {
        // 6+ months: first deletion warning
        await prisma.company.update({ where: { id: company.id }, data: { status: "INACTIVE" } });
        results.push(`WARNING 1 ${company.name} (${company.slug}) — 6+ months inactive. Account will be deleted after 12 months.`);
      } else if (monthsSince >= 3 && company.status === "ACTIVE") {
        // 3+ months: mark inactive + notification
        await prisma.company.update({ where: { id: company.id }, data: { status: "INACTIVE" } });
        results.push(`INACTIVE ${company.name} (${company.slug}) — 3+ months inactive. Status set to INACTIVE.`);
      }
    }

    return ok({ processed: companies.length, results });
  } catch (error) {
    return serverError(error);
  }
}
