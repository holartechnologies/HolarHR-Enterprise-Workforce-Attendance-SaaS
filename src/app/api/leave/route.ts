import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, created, badRequest, serverError, validatePagination } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { notifyManagers } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(req.url);
    const { skip, take, page, perPage } = validatePagination(searchParams);
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const where: Record<string, unknown> = { companyId: user.companyId };
    if (status) where.status = status;
    if (user.role === "EMPLOYEE") {
      where.employeeId = user.employeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return ok({ items: data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "leave:request")) return unauthorized();

    const { type, startDate, endDate, reason, employeeId } = await req.json();

    if (!type || !startDate || !endDate) return badRequest("Type, start date, and end date required");

    const targetEmployeeId = employeeId || user.employeeId;
    if (!targetEmployeeId) return badRequest("Employee not found");

    const leave = await prisma.leaveRequest.create({
      data: {
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        companyId: user.companyId,
        employeeId: targetEmployeeId,
      },
    });

    notifyManagers(user.companyId, {
      type: "leave_request",
      title: "New Leave Request",
      message: `${user.firstName} ${user.lastName} requested ${type.toLowerCase()} leave`,
      link: "/leave",
      entityId: leave.id,
    }).catch(() => {});

    return created(leave, "Leave request submitted");
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "leave:approve")) return unauthorized();

    const { id, status } = await req.json();
    if (!id || !status) return badRequest("ID and status required");

    if (!["APPROVED", "REJECTED"].includes(status)) return badRequest("Invalid status");

    const leave = await prisma.leaveRequest.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!leave) return badRequest("Leave request not found");

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy: user.id },
    });

    return ok(updated, `Leave ${status.toLowerCase()}`);
  } catch (error) {
    return serverError(error);
  }
}
