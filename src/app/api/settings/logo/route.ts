import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `logo-${user.companyId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    const logoUrl = `/uploads/${filename}`;

    await prisma.company.update({
      where: { id: user.companyId },
      data: { logo: logoUrl },
    });

    return ok({ logo: logoUrl }, "Logo uploaded");
  } catch (error) {
    return serverError(error);
  }
}
