import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError, validatePagination } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { hasFeature } from "@/lib/plans";
import { isWithinRadius, haversineDistance } from "@/lib/geo";
import { startOfDay, endOfDay } from "date-fns";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "attendance:view")) return unauthorized();

    const { searchParams } = new URL(req.url);
    const { skip, take, page, perPage } = validatePagination(searchParams);

    const dateStr = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status") as string;

    const where: Record<string, unknown> = { companyId: user.companyId };

    if (user.role === "EMPLOYEE") {
      where.employeeId = user.employeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) where.status = status;

    if (dateStr) {
      const date = new Date(dateStr);
      where.date = { gte: startOfDay(date), lte: endOfDay(date) };
    }

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeCode: true, department: { select: { name: true } } },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take,
      }),
      prisma.attendance.count({ where }),
    ]);

    return ok({
      items: data.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
        employeeCode: a.employee.employeeCode,
        department: a.employee.department?.name || "N/A",
        date: a.date,
        clockIn: a.clockIn,
        clockOut: a.clockOut,
        totalHours: a.totalHours,
        lateMinutes: a.lateMinutes,
        status: a.status,
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "attendance:clock_in")) {
      return unauthorized();
    }

    const body = await req.json();
    const { employeeId: bodyEmployeeId, type, latitude, longitude, qrToken, breakType, earlyClockoutReason } = body;

    let employeeId = bodyEmployeeId || user.employeeId;
    if (!employeeId) return badRequest("Employee ID required - no employee linked to your account");

    let gpsWarning: string | null = null;

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId, status: "ACTIVE" },
      include: { shift: true },
    });

    if (!employee) return badRequest("Employee not found or inactive");

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId,
        companyId: user.companyId,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { breaks: true },
    });

    if (type === "clock_in") {
      if (existingRecord?.clockIn && !existingRecord.clockOut) {
        return badRequest("Already clocked in. Clock out first.");
      }

      if (existingRecord?.clockOut) {
        return badRequest("Already completed for today");
      }

      if (latitude != null && longitude != null) {
        const gpsPlanCheck = await prisma.company.findUnique({
          where: { id: user.companyId },
          include: { plan: true },
        });

        const graceZone = gpsPlanCheck?.gpsGraceZone ?? 10;

        if (gpsPlanCheck?.plan && hasFeature(gpsPlanCheck.plan.name, "gpsAttendance")) {
          if (employee.branchId) {
            const branch = await prisma.branch.findUnique({
              where: { id: employee.branchId },
            });

            if (branch?.latitude != null && branch?.longitude != null) {
              const dist = haversineDistance(
                latitude, longitude,
                branch.latitude, branch.longitude
              );
              const outsideBy = dist - branch.radius;

              if (outsideBy > graceZone) {
                return badRequest(
                  `You are ${Math.round(dist)}m from "${branch.name}" (geofence: ${branch.radius}m, grace: ${graceZone}m, you are ${Math.round(outsideBy)}m outside). Move closer to clock in.`
                );
              }

              if (outsideBy > 0) {
                gpsWarning = `You are ${Math.round(dist)}m from "${branch.name}" — ${Math.round(outsideBy)}m outside the ${branch.radius}m geofence. Grace zone: ${graceZone}m. Clock-in recorded with proximity warning.`;
              }
            }
          }
        }
      }

      let lateMinutes = 0;
      if (employee.shift) {
        const [h, m] = employee.shift.startTime.split(":").map(Number);
        const shiftStart = new Date(today);
        shiftStart.setHours(h, m, 0, 0);
        lateMinutes = Math.max(0, Math.floor((today.getTime() - shiftStart.getTime()) / 60000));
      }

      const status = lateMinutes > (employee.shift?.graceTime ?? 15) ? "LATE" : "PRESENT";

      const record = await prisma.attendance.create({
        data: {
          date: todayStart,
          clockIn: today,
          status,
          lateMinutes,
          companyId: user.companyId,
          employeeId,
          shiftId: employee.shiftId,
          latitude,
          longitude,
          qrToken,
        },
      });

      await createAuditLog({
        action: "CLOCK_IN",
        entity: "attendance",
        entityId: record.id,
        userId: user.id,
        companyId: user.companyId,
      });

      return ok({ ...record, gpsWarning }, gpsWarning || "Clocked in successfully");
    }

    if (type === "clock_out") {
      if (!existingRecord?.clockIn) {
        return badRequest("Not clocked in today");
      }
      if (existingRecord.clockOut) {
        return badRequest("Already clocked out today");
      }

      if (employee.shift) {
        const [eh, em] = employee.shift.endTime.split(":").map(Number);
        const shiftEnd = new Date(today);
        shiftEnd.setHours(eh, em, 0, 0);
        if (today < shiftEnd && !earlyClockoutReason) {
          return badRequest("You are clocking out before your shift ends. Please provide a reason.");
        }
      }

      const totalHours = (today.getTime() - existingRecord.clockIn.getTime()) / (1000 * 60 * 60);

      const record = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          clockOut: today,
          totalHours: Math.round(totalHours * 100) / 100,
          earlyClockoutReason: earlyClockoutReason || null,
        },
      });

      await createAuditLog({
        action: "CLOCK_OUT",
        entity: "attendance",
        entityId: record.id,
        userId: user.id,
        companyId: user.companyId,
      });

      return ok(record, "Clocked out successfully");
    }

    if (type === "break_start") {
      if (!existingRecord?.clockIn || existingRecord.clockOut) {
        return badRequest("Cannot start break now");
      }

      const activeBreak = existingRecord.breaks.find((b) => !b.endTime);
      if (activeBreak) return badRequest("Already on break");

      const breakRecord = await prisma.break.create({
        data: {
          startTime: today,
          type: breakType === "lunch" ? "LUNCH" : "BREAK",
          attendanceId: existingRecord.id,
        },
      });

      return ok(breakRecord, "Break started");
    }

    if (type === "break_end") {
      if (!existingRecord?.clockIn || existingRecord.clockOut) {
        return badRequest("Cannot end break now");
      }

      const activeBreak = existingRecord.breaks.find((b) => !b.endTime);
      if (!activeBreak) return badRequest("No active break");

      const duration = Math.floor((today.getTime() - activeBreak.startTime.getTime()) / 60000);

      const breakRecord = await prisma.break.update({
        where: { id: activeBreak.id },
        data: { endTime: today, duration },
      });

      return ok(breakRecord, "Break ended");
    }

    return badRequest("Invalid type");
  } catch (error) {
    return serverError(error);
  }
}
