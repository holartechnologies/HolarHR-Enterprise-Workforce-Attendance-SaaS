import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbPath });
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

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
