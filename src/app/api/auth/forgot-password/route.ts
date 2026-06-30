import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { ok, badRequest, notFound, serverError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return badRequest("Email is required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return ok(null, "If that email exists, a reset link has been sent");

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);

    return ok({ resetUrl }, "If that email exists, a reset link has been sent");
  } catch (error) {
    return serverError(error);
  }
}
