import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return badRequest("Current password and new password required");
    }

    if (newPassword.length < 8) {
      return badRequest("New password must be at least 8 characters");
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return badRequest("User not found");

    const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isValid) return badRequest("Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return ok(null, "Password changed successfully");
  } catch (error) {
    return serverError(error);
  }
}
