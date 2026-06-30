import { prisma } from "./prisma";

type NotificationInput = {
  type: string;
  title: string;
  message: string;
  link?: string;
  companyId: string;
  userId?: string;
  role?: string;
  entityId?: string;
};

export async function createNotification(input: NotificationInput) {
  return prisma.notification.create({ data: input });
}

export async function notifyRole(companyId: string, role: string, input: Omit<NotificationInput, "companyId" | "role">) {
  return prisma.notification.create({
    data: { ...input, companyId, role },
  });
}

export async function notifyManagers(companyId: string, input: Omit<NotificationInput, "companyId">) {
  const managers = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ["COMPANY_ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER"] },
    },
    select: { id: true },
  });

  return prisma.notification.createMany({
    data: managers.map((m) => ({
      ...input,
      companyId,
      userId: m.id,
    })),
  });
}
