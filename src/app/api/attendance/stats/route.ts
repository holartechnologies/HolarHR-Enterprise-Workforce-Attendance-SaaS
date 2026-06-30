import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "attendance:view")) return unauthorized();

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [totalEmployees, todayAttendance, onLeave, branches, departments] = await Promise.all([
      prisma.employee.count({ where: { companyId: user.companyId, status: "ACTIVE" } }),
      prisma.attendance.findMany({
        where: {
          companyId: user.companyId,
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          companyId: user.companyId,
          status: "APPROVED",
          startDate: { lte: todayEnd },
          endDate: { gte: todayStart },
        },
      }),
      prisma.branch.count({ where: { companyId: user.companyId, isActive: true } }),
      prisma.department.count({ where: { companyId: user.companyId } }),
    ]);

    const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;
    const lateToday = todayAttendance.filter((a) => a.status === "LATE").length;
    const absentToday = totalEmployees - presentToday - lateToday - onLeave;
    const attendanceRate = totalEmployees > 0 ? Math.round(((presentToday + lateToday) / totalEmployees) * 100) : 0;

    const totalHoursThisWeek = todayAttendance.reduce((sum, a) => sum + (Number(a.totalHours) || 0), 0);

    return ok({
      totalEmployees,
      presentToday,
      absentToday: Math.max(0, absentToday),
      lateToday,
      onLeave,
      attendanceRate,
      totalHoursThisWeek,
      activeBranches: branches,
      activeDepartments: departments,
    });
  } catch (error) {
    return serverError(error);
  }
}
