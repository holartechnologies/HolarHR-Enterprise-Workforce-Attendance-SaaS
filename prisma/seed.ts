import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    name: "FREE" as const,
    displayName: "Free",
    description: "Perfect for small teams getting started",
    price: 0,
    maxEmployees: 3,
    maxBranches: 1,
    maxDepartments: 5,
    qrAttendance: false,
    gpsAttendance: false,
    mobileFingerprint: false,
    biometricDevices: 0,
    aiFeatures: false,
    apiAccess: false,
    prioritySupport: false,
    reports: true,
    paystackPlanCode: null,
  },
  {
    name: "STARTER" as const,
    displayName: "Starter",
    description: "For growing businesses",
    price: 29,
    maxEmployees: 25,
    maxBranches: 2,
    maxDepartments: 10,
    qrAttendance: false,
    gpsAttendance: false,
    mobileFingerprint: false,
    biometricDevices: 0,
    aiFeatures: false,
    apiAccess: false,
    prioritySupport: false,
    reports: true,
    paystackPlanCode: null,
  },
  {
    name: "BUSINESS" as const,
    displayName: "Business",
    description: "For established organizations",
    price: 99,
    maxEmployees: 250,
    maxBranches: 10,
    maxDepartments: 25,
    qrAttendance: true,
    gpsAttendance: true,
    mobileFingerprint: true,
    biometricDevices: 5,
    aiFeatures: false,
    apiAccess: true,
    prioritySupport: false,
    reports: true,
    paystackPlanCode: null,
  },
  {
    name: "ENTERPRISE" as const,
    displayName: "Enterprise",
    description: "For large enterprises with advanced needs",
    price: 299,
    maxEmployees: 99999,
    maxBranches: 999,
    maxDepartments: 999,
    qrAttendance: true,
    gpsAttendance: true,
    mobileFingerprint: true,
    biometricDevices: 99,
    aiFeatures: true,
    apiAccess: true,
    prioritySupport: true,
    reports: true,
    paystackPlanCode: null,
  },
];

async function main() {
  console.log("Seeding plans...");

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ ${plan.displayName} plan`);
  }

  const enterprisePlan = await prisma.plan.findUnique({ where: { name: "ENTERPRISE" } });
  const freePlan = await prisma.plan.findUnique({ where: { name: "FREE" } });

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create companies
  const acme = await prisma.company.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      email: "admin@acme.com",
      phone: "+1-555-0100",
      address: "123 Business Ave, Suite 100",
      size: 50,
      status: "ACTIVE",
      planId: enterprisePlan!.id,
    },
  });

  await prisma.company.upsert({
    where: { slug: "startup-inc" },
    update: {},
    create: {
      name: "Startup Inc",
      slug: "startup-inc",
      email: "hello@startup.io",
      size: 3,
      status: "ACTIVE",
      planId: freePlan!.id,
    },
  });

  // Departments
  const engineering = await prisma.department.upsert({
    where: { companyId_name: { companyId: acme.id, name: "Engineering" } },
    update: {},
    create: { name: "Engineering", description: "Software engineering team", companyId: acme.id },
  });

  await prisma.department.upsert({
    where: { companyId_name: { companyId: acme.id, name: "Human Resources" } },
    update: {},
    create: { name: "Human Resources", description: "HR team", companyId: acme.id },
  });

  await prisma.department.upsert({
    where: { companyId_name: { companyId: acme.id, name: "Marketing" } },
    update: {},
    create: { name: "Marketing", description: "Marketing team", companyId: acme.id },
  });

  // Branches
  const hq = await prisma.branch.upsert({
    where: { companyId_name: { companyId: acme.id, name: "Headquarters" } },
    update: {},
    create: {
      name: "Headquarters",
      address: "123 Business Ave, Suite 100",
      phone: "+1-555-0100",
      isActive: true,
      companyId: acme.id,
    },
  });

  await prisma.branch.upsert({
    where: { companyId_name: { companyId: acme.id, name: "Branch Office" } },
    update: {},
    create: {
      name: "Branch Office",
      address: "456 Innovation Drive",
      isActive: true,
      companyId: acme.id,
    },
  });

  // Shifts
  const morningShift = await prisma.shift.upsert({
    where: { companyId_name: { companyId: acme.id, name: "Morning" } },
    update: {},
    create: {
      name: "Morning",
      startTime: "08:00",
      endTime: "17:00",
      graceTime: 15,
      workingHours: 8,
      companyId: acme.id,
      branchId: hq.id,
    },
  });

  // Employees
  const emp1 = await prisma.employee.upsert({
    where: { companyId_employeeCode: { companyId: acme.id, employeeCode: "EMP001" } },
    update: {},
    create: {
      employeeCode: "EMP001",
      firstName: "John",
      lastName: "Doe",
      email: "john@acme.com",
      phone: "+1-555-0101",
      position: "Senior Developer",
      salary: 95000,
      hireDate: new Date("2023-01-15"),
      status: "ACTIVE",
      companyId: acme.id,
      departmentId: engineering.id,
      branchId: hq.id,
      shiftId: morningShift.id,
    },
  });

  await prisma.employee.upsert({
    where: { companyId_employeeCode: { companyId: acme.id, employeeCode: "EMP002" } },
    update: {},
    create: {
      employeeCode: "EMP002",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@acme.com",
      position: "Developer",
      salary: 75000,
      hireDate: new Date("2023-06-01"),
      status: "ACTIVE",
      companyId: acme.id,
      departmentId: engineering.id,
      branchId: hq.id,
      shiftId: morningShift.id,
    },
  });

  // Users
  const users = [
    { email: "admin@holarhr.com", firstName: "Super", lastName: "Admin", role: "SUPER_ADMIN" as const, companyId: acme.id },
    { email: "admin@acme.com", firstName: "Alice", lastName: "Johnson", role: "COMPANY_ADMIN" as const, companyId: acme.id },
    { email: "hr@acme.com", firstName: "Bob", lastName: "Williams", role: "HR_MANAGER" as const, companyId: acme.id },
    { email: "manager@acme.com", firstName: "Carol", lastName: "Brown", role: "DEPARTMENT_MANAGER" as const, companyId: acme.id },
    { email: "john@acme.com", firstName: "John", lastName: "Doe", role: "EMPLOYEE" as const, companyId: acme.id, employeeId: emp1.id },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
    console.log(`  ✓ User ${u.email}`);
  }

  // Subscription for Acme
  await prisma.subscription.upsert({
    where: { companyId: acme.id },
    update: {},
    create: {
      companyId: acme.id,
      planId: enterprisePlan!.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
