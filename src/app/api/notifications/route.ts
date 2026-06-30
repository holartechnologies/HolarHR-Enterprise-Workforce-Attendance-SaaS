import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const notifications = await prisma.notification.findMany({
      where: {
        companyId: user.companyId,
        OR: [
          { userId: user.id },
          { role: user.role },
          { userId: null, role: null },
        ],
        read: false,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const count = await prisma.notification.count({
      where: {
        companyId: user.companyId,
        OR: [
          { userId: user.id },
          { role: user.role },
          { userId: null, role: null },
        ],
        read: false,
      },
    });

    return ok({ items: notifications, unread: count });
  } catch (error) {
    return serverError(error);
  }
}
