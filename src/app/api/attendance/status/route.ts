import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!user.employeeId) {
      return ok({ clockedIn: false, onBreak: false, record: null });
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const record = await prisma.attendance.findFirst({
      where: {
        employeeId: user.employeeId,
        companyId: user.companyId,
        date: { gte: todayStart, lte: todayEnd },
      },
      include: { breaks: true },
    });

    if (!record) {
      return ok({ clockedIn: false, onBreak: false, record: null });
    }

    const clockedIn = !!record.clockIn && !record.clockOut;
    const onBreak = record.breaks.some((b) => !b.endTime);

    return ok({ clockedIn, onBreak, record });
  } catch (error) {
    return serverError(error);
  }
}
