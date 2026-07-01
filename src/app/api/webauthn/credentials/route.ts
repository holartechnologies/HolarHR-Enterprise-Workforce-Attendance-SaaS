import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, serverError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const count = await prisma.employeeCredential.count({
      where: { employeeId: user.employeeId ?? "" },
    });

    return ok({ count });
  } catch (error) {
    return serverError(error);
  }
}
