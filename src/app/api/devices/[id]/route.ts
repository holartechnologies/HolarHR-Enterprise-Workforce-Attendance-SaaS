import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError, notFound } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "settings:manage")) return unauthorized();

    const { id } = await params;
    const device = await prisma.biometricDevice.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!device) return notFound("Device not found");

    const body = await req.json();
    const { name, model, serialNumber, ipAddress, port, location, branchId, status } = body;

    const updated = await prisma.biometricDevice.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(model !== undefined && { model }),
        ...(serialNumber !== undefined && { serialNumber }),
        ...(ipAddress !== undefined && { ipAddress }),
        ...(port !== undefined && { port }),
        ...(location !== undefined && { location }),
        ...(branchId !== undefined && { branchId }),
        ...(status !== undefined && { status }),
      },
    });

    return ok(updated, "Device updated");
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "settings:manage")) return unauthorized();

    const { id } = await params;
    const device = await prisma.biometricDevice.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!device) return notFound("Device not found");

    await prisma.employeeDevice.deleteMany({ where: { deviceId: id } });
    await prisma.biometricDevice.delete({ where: { id } });

    return ok(null, "Device deleted");
  } catch (error) {
    return serverError(error);
  }
}
