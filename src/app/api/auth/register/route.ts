import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { ok, badRequest, serverError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const { companyName, email, password, firstName, lastName } = await req.json();

    if (!companyName || !email || !password || !firstName || !lastName) {
      return badRequest("All fields are required");
    }

    if (password.length < 8) {
      return badRequest("Password must be at least 8 characters");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return badRequest("Email already registered");
    }

    const slug = slugify(companyName);
    const existingCompany = await prisma.company.findUnique({ where: { slug } });
    if (existingCompany) {
      return badRequest("Company name already taken");
    }

    const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } });

    const passwordHash = await bcrypt.hash(password, 12);

    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug,
        email,
        planId: freePlan?.id,
        size: 0,
        departments: {
          create: { name: "General", description: "Default department" },
        },
      },
    });

    if (freePlan) {
      await prisma.subscription.create({
        data: {
          companyId: company.id,
          planId: freePlan.id,
          status: "ACTIVE",
        },
      });
    }

    const department = await prisma.department.findFirst({
      where: { companyId: company.id, name: "General" },
    });

    const employee = await prisma.employee.create({
      data: {
        employeeCode: `${slug.slice(0, 3).toUpperCase()}-0001`,
        firstName,
        lastName,
        email,
        status: "ACTIVE",
        companyId: company.id,
        departmentId: department?.id,
      },
    });

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: "COMPANY_ADMIN",
        companyId: company.id,
        employeeId: employee.id,
      },
    });

    return ok({ companyId: company.id }, "Account created successfully");
  } catch (error) {
    return serverError(error);
  }
}
