import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "settings:manage")) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    if (!file) return badRequest("No file provided");

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) {
      return badRequest("Invalid file type. Allowed: png, jpg, jpeg, gif, svg, webp");
    }

    if (file.size > 400 * 1024) {
      return badRequest("File too large. Max 400KB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = ext === "svg" ? "image/svg+xml" : `image/${ext === "jpg" ? "jpeg" : ext}`;
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    await prisma.company.update({
      where: { id: user.companyId },
      data: { logo: dataUrl },
    });

    return ok({ logo: dataUrl }, "Logo uploaded");
  } catch (error) {
    return serverError(error);
  }
}
