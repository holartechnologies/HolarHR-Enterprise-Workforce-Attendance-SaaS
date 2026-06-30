import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, notFound, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "department:manage")) return unauthorized();

    const { id } = await params;
    const existing = await prisma.department.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return notFound("Department not found");

    const { name, description } = await req.json();
    const data: Record<string, string | undefined> = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;

    const department = await prisma.department.update({ where: { id }, data });
    return ok(department, "Department updated");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "department:manage")) return unauthorized();

    const { id } = await params;
    const existing = await prisma.department.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return notFound("Department not found");

    await prisma.department.delete({ where: { id } });
    return ok(null, "Department deleted");
  } catch (error) {
    return serverError(error);
  }
}
