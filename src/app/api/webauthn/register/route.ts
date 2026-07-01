import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";
import { hasFeature } from "@/lib/plans";
import {
  generateRegistrationOptions,
} from "@simplewebauthn/server";

const rpName = "HolarHR";
const rpID = process.env.VERCEL
  ? "holarhrattendance.vercel.app"
  : "localhost";
const origin = process.env.VERCEL
  ? "https://holarhrattendance.vercel.app"
  : "http://localhost:3000";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!user.employeeId) return badRequest("No employee linked to your account");

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });
    if (!company?.plan || !hasFeature(company.plan.name, "mobileFingerprint")) {
      return badRequest("Mobile fingerprint not available on your plan");
    }

    const employee = await prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: { credentials: true },
    });
    if (!employee) return badRequest("Employee not found");

    const existingIds = employee.credentials.map((c) => c.id);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.employeeId,
      userName: user.email,
      attestationType: "none",
      excludeCredentials: existingIds.map((credId) => ({
        id: new Uint8Array(Buffer.from(credId, "base64url")),
        type: "public-key" as const,
      })),
    });

    return ok({ options });
  } catch (error) {
    return serverError(error);
  }
}
