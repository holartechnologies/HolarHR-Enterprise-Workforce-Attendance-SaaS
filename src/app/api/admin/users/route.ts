import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "SUPER_ADMIN") return unauthorized();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { name: true, slug: true } },
      },
    });

    return ok(users);
  } catch (error) {
    return serverError(error);
  }
}
