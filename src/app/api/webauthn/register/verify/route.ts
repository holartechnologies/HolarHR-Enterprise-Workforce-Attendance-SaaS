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
    const { response, challenge } = body;
    if (!response) return badRequest("Missing response");
    if (!challenge) return badRequest("Missing challenge");

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedRPID: rpID,
      expectedOrigin: origin,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return badRequest("Fingerprint verification failed");
    }

    const { registrationInfo } = verification;
    const credentialId = Buffer.from(registrationInfo.credentialID).toString("base64url");

    await prisma.employeeCredential.create({
      data: {
        id: credentialId,
        publicKey: Buffer.from(registrationInfo.credentialPublicKey),
        counter: registrationInfo.counter,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp ?? false,
        transports: body.response?.transports ?? [],
        employeeId: user.employeeId,
        companyId: user.companyId,
      },
    });

    return ok(null, "Fingerprint registered successfully");
  } catch (error) {
    return serverError(error);
  }
}
