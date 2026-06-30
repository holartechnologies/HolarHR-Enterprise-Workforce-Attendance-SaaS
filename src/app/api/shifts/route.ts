import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, created, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const shifts = await prisma.shift.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });

    return ok(shifts);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "shift:manage")) return unauthorized();

    const { name, startTime, endTime, graceTime, branchId } = await req.json();
    if (!name || !startTime || !endTime) return badRequest("Name, start time, and end time required");

    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    let diff = endMin - startMin;
    if (diff < 0) diff += 24 * 60;
    const workingHours = Math.round((diff / 60) * 100) / 100;

    const shift = await prisma.shift.create({
      data: {
        name,
        startTime,
        endTime,
        graceTime: graceTime || 15,
        workingHours,
        companyId: user.companyId,
        branchId: branchId || undefined,
      },
    });

    return created(shift, "Shift created");
  } catch (error) {
    return serverError(error);
  }
}
