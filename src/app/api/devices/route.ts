import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, created, badRequest, serverError } from "@/lib/api-utils";
import { getPlanLimits, canAddDevice } from "@/lib/plans";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const devices = await prisma.biometricDevice.findMany({
      where: { companyId: user.companyId },
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { employeeDevices: true } },
      },
      orderBy: { name: "asc" },
    });

    return ok(devices);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "settings:manage")) return unauthorized();

    const { name, model, serialNumber, ipAddress, port, location, branchId } = await req.json();
    if (!name) return badRequest("Device name required");

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });
    if (!company) return badRequest("Company not found");

    const planName = company.plan?.name || "FREE";
    const deviceCount = await prisma.biometricDevice.count({ where: { companyId: user.companyId } });

    if (!canAddDevice(planName, deviceCount)) {
      const max = getPlanLimits(planName).biometricDevices;
      return badRequest(`Plan limit reached: max ${max} biometric devices`);
    }

    const device = await prisma.biometricDevice.create({
      data: {
        name,
        model: model || null,
        serialNumber: serialNumber || null,
        ipAddress: ipAddress || null,
        port: port || 4370,
        location: location || null,
        branchId: branchId || null,
        companyId: user.companyId,
      },
    });

    return created(device, "Device added");
  } catch (error) {
    return serverError(error);
  }
}
