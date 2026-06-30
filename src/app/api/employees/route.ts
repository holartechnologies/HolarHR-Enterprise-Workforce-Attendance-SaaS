import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, ok, created, badRequest, serverError, validatePagination } from "@/lib/api-utils";
import { hasPermission } from "@/lib/rbac";
import { getPlanLimits } from "@/lib/plans";
import { createAuditLog } from "@/lib/audit";
import { cacheKey, cacheDel } from "@/lib/redis";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasPermission(user.role, "employee:view")) return unauthorized();

    const { searchParams } = new URL(req.url);
    const { skip, take, page, perPage } = validatePagination(searchParams);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId");
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { companyId: user.companyId };
    if (user.role === "EMPLOYEE") where.id = user.employeeId;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeCode: { contains: search, mode: "insensitive" } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          shift: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.employee.count({ where }),
    ]);

    return ok({ items: data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    if (!hasPermission(user.role, "employee:manage")) return unauthorized();

    const body = await req.json();
    const { firstName, lastName, email, phone, position, departmentId, branchId, shiftId } = body;

    if (!firstName || !lastName) return badRequest("First and last name required");

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      include: { plan: true },
    });

    if (!company) return badRequest("Company not found");

    const planName = company.plan?.name || "FREE";
    const limits = getPlanLimits(planName);
    const employeeCount = await prisma.employee.count({ where: { companyId: user.companyId } });

    if (employeeCount >= limits.maxEmployees) {
      return badRequest(`Plan limit reached: max ${limits.maxEmployees} employees`);
    }

    const lastEmployee = await prisma.employee.findFirst({
      where: { companyId: user.companyId },
      orderBy: { employeeCode: "desc" },
    });

    const nextIndex = lastEmployee ? parseInt(lastEmployee.employeeCode.split("-")[1]) + 1 : 1;
    const employeeCode = `${company.slug.slice(0, 3).toUpperCase()}-${String(nextIndex).padStart(4, "0")}`;

    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email,
        phone,
        position,
        companyId: user.companyId,
        departmentId: departmentId || undefined,
        branchId: branchId || undefined,
        shiftId: shiftId || undefined,
      },
    });

    let tempPassword: string | undefined;
    if (email) {
      tempPassword = crypto.randomBytes(4).toString("hex");
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            role: "EMPLOYEE",
            companyId: user.companyId,
            employeeId: employee.id,
          },
        });
      }
    }

    await createAuditLog({
      action: "EMPLOYEE_CREATED",
      entity: "employee",
      entityId: employee.id,
      details: { employeeCode, tempPassword },
      userId: user.id,
      companyId: user.companyId,
    });

    await cacheDel(cacheKey("employees", user.companyId, "*"));

    return created({ ...employee, tempPassword }, "Employee created successfully");
  } catch (error) {
    return serverError(error);
  }
}
