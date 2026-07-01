import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

const rpID = process.env.VERCEL
  ? "holarhrattendance.vercel.app"
  : "localhost";
const origin = process.env.VERCEL
  ? "https://holarhrattendance.vercel.app"
  : "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!user.employeeId) return badRequest("No employee linked");

    const body = await req.json();
    const { response } = body;
    if (!response) return badRequest("Missing response");

    const verification = await verifyRegistrationResponse({
      response,
      expectedRPID: rpID,
      expectedOrigin: origin,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return badRequest("Fingerprint verification failed");
    }

    const { credential } = verification.registrationInfo;

    await prisma.employeeCredential.create({
      data: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceType: credential.deviceType,
        backedUp: credential.backedUp ?? false,
        transports: credential.transports ?? [],
        employeeId: user.employeeId,
        companyId: user.companyId,
      },
    });

    return ok(null, "Fingerprint registered successfully");
  } catch (error) {
    return serverError(error);
  }
}
