import { PrismaClient, type AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { departmentColor } from "../src/lib/colors";
import { slugify, generateInviteCode } from "../src/lib/org";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Ravi", "Suresh", "Anita", "Priya", "Vikram", "Sunita", "Manoj", "Kavita",
  "Rajesh", "Deepa", "Arjun", "Meena", "Sanjay", "Pooja", "Amit", "Neha",
  "Vijay", "Rekha", "Ashok", "Geeta", "Ramesh", "Lata", "Naresh", "Shalini",
  "Dinesh", "Usha", "Mahesh", "Radha", "Prakash", "Sarita", "Ganesh", "Jyoti",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Yadav", "Rao", "Naidu", "Reddy", "Khan",
  "Shah", "Mehta", "Joshi", "Nair", "Iyer", "Pillai", "Gowda", "Chauhan",
];

const DESIGNATIONS = [
  "Machine Operator", "Senior Tailor", "Embroidery Artist", "Line Supervisor",
  "Helper", "Quality Checker", "Cutting Master", "Packing Staff",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return "9" + Math.floor(100000000 + Math.random() * 899999999).toString();
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
}

async function uniqueInviteCode(): Promise<string> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const code = generateInviteCode();
    const existing = await prisma.organization.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
}

type OrgConfig = {
  orgName: string;
  adminUsername: string;
  adminPassword: string;
  adminName: string;
  departmentNames: string[];
  pendingRegistrations?: number;
};

async function seedOrganization(config: OrgConfig) {
  let organization = await prisma.organization.findFirst({
    where: { admin: { username: config.adminUsername } },
  });

  if (organization) {
    console.log(`Organization "${config.orgName}" already seeded — updating admin password only.`);
    const passwordHash = await bcrypt.hash(config.adminPassword, 10);
    await prisma.adminUser.update({
      where: { organizationId: organization.id },
      data: { passwordHash },
    });
    return organization;
  }

  const slug = await uniqueSlug(config.orgName);
  const inviteCode = await uniqueInviteCode();
  const passwordHash = await bcrypt.hash(config.adminPassword, 10);

  organization = await prisma.organization.create({
    data: {
      name: config.orgName,
      slug,
      inviteCode,
      admin: {
        create: {
          username: config.adminUsername,
          passwordHash,
          name: config.adminName,
        },
      },
    },
  });

  console.log(
    `Created organization "${organization.name}" — admin login: ${config.adminUsername} / ${config.adminPassword} — invite code: ${inviteCode}`
  );

  const departmentRecords = [];
  for (let i = 0; i < config.departmentNames.length; i++) {
    const dept = await prisma.department.create({
      data: {
        name: config.departmentNames[i],
        color: departmentColor(i),
        organizationId: organization.id,
      },
    });
    departmentRecords.push(dept);
  }

  const usedNames = new Set<string>();
  const workers = [];

  for (const dept of departmentRecords) {
    const workerCount = 5 + Math.floor(Math.random() * 5); // 5-9 workers per dept
    for (let i = 0; i < workerCount; i++) {
      let fullName = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
      let attempt = 0;
      while (usedNames.has(fullName) && attempt < 10) {
        fullName = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
        attempt++;
      }
      usedNames.add(fullName);

      const joiningDaysAgo = Math.floor(Math.random() * 900) + 30;
      const joiningDate = new Date();
      joiningDate.setDate(joiningDate.getDate() - joiningDaysAgo);

      const worker = await prisma.worker.create({
        data: {
          name: fullName,
          designation: randomFrom(DESIGNATIONS),
          phone: randomPhone(),
          joiningDate,
          isActive: Math.random() > 0.05,
          departmentId: dept.id,
          organizationId: organization.id,
          approvalStatus: "APPROVED",
          source: "ADMIN",
          monthlySalary: Math.random() > 0.15 ? 8000 + Math.floor(Math.random() * 9) * 1000 : null,
        },
      });
      workers.push(worker);
    }
  }
  console.log(`  Workers created: ${workers.length}`);

  // A couple of pending self-registrations, to demo the approval flow.
  for (let i = 0; i < (config.pendingRegistrations ?? 0); i++) {
    let fullName = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
    while (usedNames.has(fullName)) {
      fullName = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
    }
    usedNames.add(fullName);

    await prisma.worker.create({
      data: {
        name: fullName,
        designation: randomFrom(DESIGNATIONS),
        phone: randomPhone(),
        joiningDate: new Date(),
        isActive: true,
        departmentId: randomFrom(departmentRecords).id,
        organizationId: organization.id,
        approvalStatus: "PENDING",
        source: "SELF",
      },
    });
  }
  if (config.pendingRegistrations) {
    console.log(`  Pending self-registrations created: ${config.pendingRegistrations}`);
  }

  // Attendance history for the last 21 days for approved workers only.
  const approvedWorkers = workers;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statusPool: AttendanceStatus[] = [
    "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT",
    "ABSENT", "HALF_DAY", "LEAVE",
  ];

  const attendanceData: { workerId: string; date: Date; status: AttendanceStatus; organizationId: string }[] = [];
  for (let dayOffset = 20; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const isSunday = date.getDay() === 0;

    for (const worker of approvedWorkers) {
      if (!worker.isActive) continue;
      if (worker.joiningDate > date) continue;

      const status: AttendanceStatus = isSunday ? "HOLIDAY" : randomFrom(statusPool);
      attendanceData.push({ workerId: worker.id, date, status, organizationId: organization.id });
    }
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < attendanceData.length; i += BATCH_SIZE) {
    const batch = attendanceData.slice(i, i + BATCH_SIZE);
    await prisma.attendanceRecord.createMany({ data: batch });
  }
  console.log(`  Attendance records created: ${attendanceData.length}`);

  return organization;
}

async function main() {
  console.log("Seeding database...");

  await seedOrganization({
    orgName: "Sunrise Textiles",
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "admin123",
    adminName: "Admin",
    departmentNames: [
      "Embroidery",
      "Cutting",
      "Stitching",
      "Dyeing",
      "Printing",
      "Finishing & Packing",
      "Quality Control",
      "Warehouse & Dispatch",
    ],
    pendingRegistrations: 2,
  });

  await seedOrganization({
    orgName: "Bloom Embroidery Works",
    adminUsername: "bloomadmin",
    adminPassword: "bloom123",
    adminName: "Bloom Admin",
    departmentNames: ["Embroidery", "Cutting", "Finishing & Packing", "Quality Control"],
    pendingRegistrations: 1,
  });

  console.log("Seeding complete.");
  console.log("\nTwo separate organizations were seeded to demonstrate multi-tenant isolation:");
  console.log("  1) Sunrise Textiles     — login: admin / admin123");
  console.log("  2) Bloom Embroidery Works — login: bloomadmin / bloom123");
  console.log("Each organization's dashboard, workers and attendance are completely separate.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
