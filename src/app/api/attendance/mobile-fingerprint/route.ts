import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, badRequest, serverError } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { hasFeature } from "@/lib/plans";
import type { AuthenticatorTransport } from "@simplewebauthn/server";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { startOfDay, endOfDay } from "date-fns";
import { createAuditLog } from "@/lib/audit";

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
    if (!user.employeeId) return badRequest("No employee linked");

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });
    if (!company?.plan || !hasFeature(company.plan.name, "mobileFingerprint")) {
      return badRequest("Mobile fingerprint not available on your plan");
    }

    const credentials = await prisma.employeeCredential.findMany({
      where: { employeeId: user.employeeId },
    });
    if (credentials.length === 0) return badRequest("No fingerprint registered. Register one first.");

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((c) => ({
        id: c.id,
        type: "public-key" as const,
      })),
    });

    return ok({ options });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "attendance:clock_in")) return unauthorized();
    if (!user.employeeId) return badRequest("No employee linked");

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });
    if (!company?.plan || !hasFeature(company.plan.name, "mobileFingerprint")) {
      return badRequest("Mobile fingerprint not available on your plan");
    }

    const body = await req.json();
    const { credentialId, response, challenge, type, earlyClockoutReason } = body;

    if (!credentialId || !response) return badRequest("Missing credential ID or response");

    const credential = await prisma.employeeCredential.findFirst({
      where: { id: credentialId, employeeId: user.employeeId, companyId: user.companyId },
    });
    if (!credential) return badRequest("Credential not found");

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedRPID: rpID,
      expectedOrigin: origin,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(credential.publicKey),
        counter: Number(credential.counter),
        transports: credential.transports as AuthenticatorTransport[],
      },
    });

    if (!verification.verified) {
      return badRequest("Fingerprint verification failed");
    }

    const employee = await prisma.employee.findFirst({
      where: { id: user.employeeId, companyId: user.companyId, status: "ACTIVE" },
      include: { shift: true },
    });
    if (!employee) return badRequest("Employee not found or inactive");

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const existingRecord = await prisma.attendance.findFirst({
      where: {
        employeeId: user.employeeId,
        companyId: user.companyId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (type === "clock_in") {
      if (existingRecord?.clockIn && !existingRecord.clockOut) {
        return badRequest("Already clocked in. Clock out first.");
      }
      if (existingRecord?.clockOut) {
        return badRequest("Already completed for today");
      }

      let lateMinutes = 0;
      if (employee.shift) {
        const [h, m] = employee.shift.startTime.split(":").map(Number);
        const shiftStart = new Date(today);
        shiftStart.setHours(h, m, 0, 0);
        lateMinutes = Math.max(0, Math.floor((today.getTime() - shiftStart.getTime()) / 60000));
      }

      const status = lateMinutes > (employee.shift?.graceTime ?? 15) ? "LATE" : "PRESENT";

      const record = await prisma.attendance.create({
        data: {
          date: todayStart,
          clockIn: today,
          status,
          lateMinutes,
          companyId: user.companyId,
          employeeId: user.employeeId,
          shiftId: employee.shiftId,
          note: "Mobile fingerprint",
        },
      });

      const newCounter = verification.authenticationInfo?.newCounter ?? Number(credential.counter) + 1;
      await prisma.employeeCredential.update({
        where: { id: credential.id },
        data: { counter: newCounter },
      });

      await createAuditLog({
        action: "CLOCK_IN",
        entity: "attendance",
        entityId: record.id,
        userId: user.id,
        companyId: user.companyId,
      });

      return ok(record, "Clocked in with fingerprint");
    }

    if (type === "clock_out") {
      if (!existingRecord?.clockIn) return badRequest("Not clocked in today");
      if (existingRecord.clockOut) return badRequest("Already clocked out today");

      if (employee.shift) {
        const [eh, em] = employee.shift.endTime.split(":").map(Number);
        const shiftEnd = new Date(today);
        shiftEnd.setHours(eh, em, 0, 0);
        if (today < shiftEnd && !earlyClockoutReason) {
          return badRequest("You are clocking out before your shift ends. Please provide a reason.");
        }
      }

      const totalHours = (today.getTime() - existingRecord.clockIn.getTime()) / (1000 * 60 * 60);

      const record = await prisma.attendance.update({
        where: { id: existingRecord.id },
        data: {
          clockOut: today,
          totalHours: Math.round(totalHours * 100) / 100,
          earlyClockoutReason: earlyClockoutReason || null,
          note: existingRecord.note
            ? `${existingRecord.note} | Clock-out via fingerprint`
            : "Mobile fingerprint",
        },
      });

      const newCounter = verification.authenticationInfo?.newCounter ?? Number(credential.counter) + 1;
      await prisma.employeeCredential.update({
        where: { id: credential.id },
        data: { counter: newCounter },
      });

      await createAuditLog({
        action: "CLOCK_OUT",
        entity: "attendance",
        entityId: record.id,
        userId: user.id,
        companyId: user.companyId,
      });

      return ok(record, "Clocked out with fingerprint");
    }

    return badRequest("Invalid type");
  } catch (error) {
    return serverError(error);
  }
}
