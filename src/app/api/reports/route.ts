import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { startOfDay, endOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "reports:view")) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "daily";
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const departmentId = searchParams.get("departmentId");
    const branchId = searchParams.get("branchId");

    if (!startDateStr || !endDateStr) return badRequest("Start date and end date required");

    const startDate = startOfDay(new Date(startDateStr));
    const endDate = endOfDay(new Date(endDateStr));

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      date: { gte: startDate, lte: endDate },
    };

    if (user.role === "EMPLOYEE") {
      where.employeeId = user.employeeId;
    } else {
      if (departmentId) where.employee = { departmentId };
      if (branchId) where.employee = { ...(where.employee as Record<string, unknown>), branchId };
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: [{ employeeId: "asc" }, { date: "asc" }],
    });

    const totalEmployees = user.role === "EMPLOYEE" ? 1 : await prisma.employee.count({
      where: {
        companyId: user.companyId,
        ...(departmentId && { departmentId }),
        ...(branchId && { branchId }),
        status: "ACTIVE",
      },
    });

    const workingDays = attendanceRecords.length;
    const present = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const late = attendanceRecords.filter((a) => a.status === "LATE").length;
    const absent = attendanceRecords.filter((a) => a.status === "ABSENT").length;
    const totalHours = attendanceRecords.reduce((sum, a) => sum + Number(a.totalHours || 0), 0);

    const summary = {
      type,
      period: { start: startDateStr, end: endDateStr },
      totalEmployees,
      totalRecords: attendanceRecords.length,
      present,
      late,
      absent,
      attendanceRate: totalEmployees > 0 ? Math.round(((present + late) / (workingDays || 1)) * 100) : 0,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerDay: workingDays > 0 ? Math.round((totalHours / workingDays) * 100) / 100 : 0,
      records: attendanceRecords.map((a) => ({
        date: format(a.date, "yyyy-MM-dd"),
        employee: `${a.employee.firstName} ${a.employee.lastName}`,
        code: a.employee.employeeCode,
        department: a.employee.department?.name,
        branch: a.employee.branch?.name,
        clockIn: a.clockIn ? format(a.clockIn, "HH:mm") : "-",
        clockOut: a.clockOut ? format(a.clockOut, "HH:mm") : "-",
        hours: a.totalHours,
        lateMinutes: a.lateMinutes,
        status: a.status,
      })),
    };

    return ok(summary);
  } catch (error) {
    return serverError(error);
  }
}
