import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, notFound, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";
import { cacheDel, cacheKey } from "@/lib/redis";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const employee = await prisma.employee.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        department: true,
        branch: true,
        shift: true,
        user: { select: { id: true, email: true, role: true, isActive: true } },
      },
    });

    if (!employee) return notFound("Employee not found");
    return ok(employee);
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "employee:manage")) return unauthorized();

    const { id } = await params;
    const existing = await prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return notFound("Employee not found");

    const body = await req.json();
    const { firstName, lastName, email, phone, position, departmentId, branchId, shiftId, status } = body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(position !== undefined && { position }),
        ...(departmentId !== undefined && { departmentId }),
        ...(branchId !== undefined && { branchId }),
        ...(shiftId !== undefined && { shiftId }),
        ...(status && { status }),
      },
    });

    await createAuditLog({
      action: "EMPLOYEE_UPDATED",
      entity: "employee",
      entityId: employee.id,
      userId: user.id,
      companyId: user.companyId,
    });

    await cacheDel(cacheKey("employees", user.companyId, "*"));

    return ok(employee, "Employee updated");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "employee:manage")) return unauthorized();

    const { id } = await params;
    const existing = await prisma.employee.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return notFound("Employee not found");

    const employee = await prisma.employee.delete({
      where: { id },
    });

    await createAuditLog({
      action: "EMPLOYEE_DELETED",
      entity: "employee",
      entityId: id,
      userId: user.id,
      companyId: user.companyId,
    });

    await cacheDel(cacheKey("employees", user.companyId, "*"));

    return ok(null, "Employee deleted");
  } catch (error) {
    return serverError(error);
  }
}
