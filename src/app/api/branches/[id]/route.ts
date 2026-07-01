import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError, notFound } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "branch:manage")) return unauthorized();

    const { id } = await params;
    const branch = await prisma.branch.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!branch) return notFound("Branch not found");

    const body = await req.json();
    const { name, address, phone, email, latitude, longitude, radius, isActive } = body;

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(radius !== undefined && { radius }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok(updated, "Branch updated");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "branch:manage")) return unauthorized();

    const { id } = await params;
    const branch = await prisma.branch.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!branch) return notFound("Branch not found");

    const employeeCount = await prisma.employee.count({ where: { branchId: id } });
    if (employeeCount > 0) {
      return badRequest(`Cannot delete: ${employeeCount} employee(s) are assigned to this branch`);
    }

    await prisma.branch.delete({ where: { id } });
    return ok(null, "Branch deleted");
  } catch (error) {
    return serverError(error);
  }
}
