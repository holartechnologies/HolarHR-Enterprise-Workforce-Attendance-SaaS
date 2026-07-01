import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: {
        plan: true,
        subscription: true,
        _count: { select: { employees: true, departments: true, branches: true } },
      },
    });

    return ok(company);
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "settings:manage")) return unauthorized();

    const body = await req.json();
    const { name, email, phone, address, website, logo, gpsGraceZone } = body;

    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(website !== undefined && { website }),
        ...(logo !== undefined && { logo }),
        ...(gpsGraceZone !== undefined && { gpsGraceZone }),
      },
    });

    return ok(company, "Settings updated");
  } catch (error) {
    return serverError(error);
  }
}
