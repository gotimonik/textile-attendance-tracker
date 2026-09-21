import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { slugify, generateInviteCode } from "@/lib/org";
import { getOrgSession } from "@/lib/session";

const signupSchema = z.object({
  organizationName: z.string().trim().min(2, "Organization name must be at least 2 characters").max(80),
  adminName: z.string().trim().min(2, "Your name must be at least 2 characters").max(60),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, dots, dashes and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 1;
  for (;;) {
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
}

async function uniqueInviteCode(): Promise<string> {
  for (;;) {
    const code = generateInviteCode();
    const existing = await prisma.organization.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { organizationName, adminName, username, password } = parsed.data;

  const existingUser = await prisma.adminUser.findUnique({ where: { username } });
  if (existingUser) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }

  const slug = await uniqueSlug(organizationName);
  const inviteCode = await uniqueInviteCode();
  const passwordHash = await bcrypt.hash(password, 10);

  const organization = await prisma.organization.create({
    data: {
      name: organizationName,
      slug,
      inviteCode,
      admin: {
        create: { username, passwordHash, name: adminName },
      },
    },
  });

  return NextResponse.json({ organization: { id: organization.id, name: organization.name } }, { status: 201 });
}

/** Admin-only: the signed-in admin's own organization settings. */
export async function GET() {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organization = await prisma.organization.findUnique({
    where: { id: org.organizationId },
    select: { name: true, slug: true, inviteCode: true, salaryDivisorDays: true },
  });
  if (!organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  return NextResponse.json({ organization });
}

const settingsSchema = z.object({
  salaryDivisorDays: z.coerce.number().int().min(1).max(31).nullable(),
});

export async function PATCH(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const organization = await prisma.organization.update({
    where: { id: org.organizationId },
    data: { salaryDivisorDays: parsed.data.salaryDivisorDays },
    select: { name: true, slug: true, inviteCode: true, salaryDivisorDays: true },
  });

  return NextResponse.json({ organization });
}
