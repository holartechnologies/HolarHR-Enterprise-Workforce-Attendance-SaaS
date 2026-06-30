import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, created, badRequest, serverError } from "@/lib/api-utils";
import { getPlanLimits } from "@/lib/plans";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const branches = await prisma.branch.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });

    return ok(branches);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "branch:manage")) return unauthorized();

    const { name, address, phone, email, latitude, longitude, radius } = await req.json();
    if (!name) return badRequest("Branch name required");

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });
    if (!company) return badRequest("Company not found");

    const limits = getPlanLimits(company.plan?.name || "FREE");
    const branchCount = await prisma.branch.count({ where: { companyId: user.companyId } });

    if (branchCount >= limits.maxBranches) {
      return badRequest(`Plan limit reached: max ${limits.maxBranches} branches`);
    }

    const branch = await prisma.branch.create({
      data: { name, address, phone, email, latitude, longitude, radius, companyId: user.companyId },
    });

    return created(branch, "Branch created");
  } catch (error) {
    return serverError(error);
  }
}
