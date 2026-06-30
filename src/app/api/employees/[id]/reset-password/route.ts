import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, notFound, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "employee:manage")) return unauthorized();

    const { id } = await params;
    const employee = await prisma.employee.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!employee) return notFound("Employee not found");

    const linkedUser = employee.email
      ? await prisma.user.findUnique({ where: { email: employee.email } })
      : null;

    if (!linkedUser) return badRequest("Employee has no linked user account");

    const tempPassword = crypto.randomBytes(4).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: linkedUser.id },
      data: { passwordHash },
    });

    return ok({ tempPassword }, "Password reset successfully");
  } catch (error) {
    return serverError(error);
  }
}
