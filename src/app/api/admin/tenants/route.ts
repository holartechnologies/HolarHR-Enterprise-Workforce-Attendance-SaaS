import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError, badRequest } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPER_ADMIN") return unauthorized();

    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        plan: { select: { displayName: true, name: true } },
        subscription: { select: { status: true } },
        _count: { select: { users: true, employees: true } },
      },
    });

    return ok(companies);
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPER_ADMIN") return unauthorized();

    const { id, name, email, phone, address, website, status, planId } = await req.json();
    if (!id) return badRequest("Company ID required");

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address;
    if (website !== undefined) data.website = website;
    if (status !== undefined) data.status = status;
    if (planId !== undefined) data.planId = planId;

    await prisma.company.update({ where: { id }, data });
    return ok(null, "Company updated");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPER_ADMIN") return unauthorized();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || (await req.json().then((b) => b.id).catch(() => null));
    if (!id) return badRequest("Company ID required");

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return badRequest("Company not found");

    const attendanceIds = (await prisma.attendance.findMany({ where: { companyId: id }, select: { id: true } })).map(a => a.id);

    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { companyId: id } }),
      prisma.auditLog.deleteMany({ where: { companyId: id } }),
      ...(attendanceIds.length ? [prisma.break.deleteMany({ where: { attendanceId: { in: attendanceIds } } })] : []),
      prisma.attendance.deleteMany({ where: { companyId: id } }),
      prisma.leaveRequest.deleteMany({ where: { companyId: id } }),
      prisma.apiKey.deleteMany({ where: { companyId: id } }),
      prisma.user.deleteMany({ where: { companyId: id } }),
      prisma.employee.deleteMany({ where: { companyId: id } }),
      prisma.shift.deleteMany({ where: { companyId: id } }),
      prisma.branch.deleteMany({ where: { companyId: id } }),
      prisma.department.deleteMany({ where: { companyId: id } }),
      prisma.subscription.deleteMany({ where: { companyId: id } }),
      prisma.company.delete({ where: { id } }),
    ]);

    return ok(null, "Company deleted permanently");
  } catch (error) {
    return serverError(error);
  }
}
