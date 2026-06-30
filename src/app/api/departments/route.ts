import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, created, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const departments = await prisma.department.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });

    return ok(departments);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "department:manage")) return unauthorized();

    const { name, description } = await req.json();
    if (!name) return badRequest("Department name required");

    const existing = await prisma.department.findUnique({
      where: { companyId_name: { companyId: user.companyId, name } },
    });
    if (existing) return badRequest("Department already exists");

    const department = await prisma.department.create({
      data: { name, description, companyId: user.companyId },
    });

    return created(department, "Department created");
  } catch (error) {
    return serverError(error);
  }
}
