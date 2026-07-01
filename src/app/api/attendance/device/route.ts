import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "attendance:clock_in")) return unauthorized();

    const { deviceId, employeeId, timestamp, type } = await req.json();
    if (!deviceId || !employeeId) return badRequest("Device ID and Employee ID required");

    const device = await prisma.biometricDevice.findFirst({
      where: { id: deviceId, companyId: user.companyId },
    });
    if (!device) return badRequest("Device not found");

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId, status: "ACTIVE" },
    });
    if (!employee) return badRequest("Employee not found or inactive");

    const punchTime = timestamp ? new Date(timestamp) : new Date();

    const todayStart = startOfDay(punchTime);
    const todayEnd = endOfDay(punchTime);

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        companyId: user.companyId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (type === "clock_in") {
      if (existingRecord?.clockIn && !existingRecord.clockOut) {
        return badRequest("Already clocked in today");
      }
      if (existingRecord?.clockOut) {
        return badRequest("Already completed for today");
      }

      const record = await prisma.attendance.create({
        data: {
          date: todayStart,
          clockIn: punchTime,
          status: "PRESENT",
          companyId: user.companyId,
          employeeId,
          note: `Imported from device: ${device.name}`,
        },
      });

      return ok(record, "Clock-in imported from device");
    }

    if (type === "clock_out") {
      if (!existingRecord?.clockIn) return badRequest("Not clocked in today");
      if (existingRecord.clockOut) return badRequest("Already clocked out today");

      const totalHours = (punchTime.getTime() - existingRecord.clockIn.getTime()) / (1000 * 60 * 60);

      const record = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          clockOut: punchTime,
          totalHours: Math.round(totalHours * 100) / 100,
          note: existingRecord.note
            ? `${existingRecord.note} | Clock-out from: ${device.name}`
            : `Clock-out from: ${device.name}`,
        },
      });

      return ok(record, "Clock-out imported from device");
    }

    return badRequest("Invalid type. Use clock_in or clock_out");
  } catch (error) {
    return serverError(error);
  }
}
