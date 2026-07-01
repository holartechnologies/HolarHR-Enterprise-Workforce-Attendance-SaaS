import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, created, badRequest, serverError, notFound } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const employee = await prisma.employee.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!employee) return notFound("Employee not found");

    const enrollments = await prisma.employeeDevice.findMany({
      where: { employeeId: id, companyId: user.companyId },
      include: {
        device: { select: { id: true, name: true, model: true, ipAddress: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(enrollments);
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "employee:manage")) return unauthorized();

    const { id } = await params;
    const employee = await prisma.employee.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!employee) return notFound("Employee not found");

    const { deviceId, deviceUserId } = await req.json();
    if (!deviceId) return badRequest("Device ID required");

    const device = await prisma.biometricDevice.findFirst({
      where: { id: deviceId, companyId: user.companyId },
    });
    if (!device) return badRequest("Device not found");

    const existing = await prisma.employeeDevice.findUnique({
      where: { employeeId_deviceId: { employeeId: id, deviceId } },
    });
    if (existing) return badRequest("Employee already enrolled on this device");

    const enrollment = await prisma.employeeDevice.create({
      data: {
        employeeId: id,
        deviceId,
        deviceUserId: deviceUserId || null,
        enrollmentStatus: "enrolled",
        enrolledAt: new Date(),
        companyId: user.companyId,
      },
    });

    return created(enrollment, "Employee enrolled on device");
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
    const url = new URL(req.url);
    const deviceId = url.searchParams.get("deviceId");
    if (!deviceId) return badRequest("deviceId query param required");

    const enrollment = await prisma.employeeDevice.findUnique({
      where: { employeeId_deviceId: { employeeId: id, deviceId } },
    });
    if (!enrollment) return notFound("Enrollment not found");

    await prisma.employeeDevice.delete({ where: { id: enrollment.id } });
    return ok(null, "Employee unenrolled from device");
  } catch (error) {
    return serverError(error);
  }
}
