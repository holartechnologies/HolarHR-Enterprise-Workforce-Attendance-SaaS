import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    await prisma.notification.updateMany({
      where: { id, companyId: user.companyId },
      data: { read: true },
    });

    return ok(null, "Marked as read");
  } catch (error) {
    return serverError(error);
  }
}
