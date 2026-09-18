import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPin, normalizePhone, PIN_PATTERN } from "@/lib/worker-auth";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const organization = await prisma.organization.findUnique({
    where: { inviteCode: code },
    include: {
      departments: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, color: true },
      },
    },
  });

  if (!organization) {
    return NextResponse.json({ error: "This invite link is invalid or has expired" }, { status: 404 });
  }

  return NextResponse.json({
    organization: { name: organization.name, departments: organization.departments },
  });
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  departmentId: z.string().min(1, "Please select a department"),
  designation: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "A phone number is required for logging in later").max(20),
  pin: z.string().regex(PIN_PATTERN, "PIN must be 4 to 6 digits"),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const organization = await prisma.organization.findUnique({ where: { inviteCode: code } });
  if (!organization) {
    return NextResponse.json({ error: "This invite link is invalid or has expired" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const department = await prisma.department.findFirst({
    where: { id: parsed.data.departmentId, organizationId: organization.id },
  });
  if (!department) {
    return NextResponse.json({ error: "Selected department does not exist" }, { status: 400 });
  }

  const phone = normalizePhone(parsed.data.phone);

  const existingLogin = await prisma.worker.findFirst({
    where: { organizationId: organization.id, phone, pinHash: { not: null } },
  });
  if (existingLogin) {
    return NextResponse.json(
      { error: "This phone number is already registered here. Try signing in instead." },
      { status: 409 }
    );
  }

  const pinHash = await hashPin(parsed.data.pin);

  const worker = await prisma.worker.create({
    data: {
      name: parsed.data.name,
      designation: parsed.data.designation || null,
      phone,
      pinHash,
      departmentId: department.id,
      organizationId: organization.id,
      approvalStatus: "PENDING",
      source: "SELF",
    },
  });

  return NextResponse.json({ worker: { id: worker.id, name: worker.name } }, { status: 201 });
}
