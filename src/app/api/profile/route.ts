import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { firstName, lastName, email, phone } = await req.json();

    const data: Record<string, string | undefined | null> = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });

    if (user.employeeId) {
      await prisma.employee.update({
        where: { id: user.employeeId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        },
      });
    }

    return ok(updated, "Profile updated");
  } catch (error) {
    return serverError(error);
  }
}
