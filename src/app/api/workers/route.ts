import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";
import { hashPin, normalizePhone, PIN_PATTERN } from "@/lib/worker-auth";
import { workerSelect, toClientWorker } from "@/lib/worker-select";

export async function GET(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const departmentId = searchParams.get("departmentId");
  const q = searchParams.get("q");
  const active = searchParams.get("active"); // "true" | "false" | null (all)
  const approval = searchParams.get("approval"); // "PENDING" | "APPROVED" | "REJECTED" | null (all)

  const workers = await prisma.worker.findMany({
    where: {
      organizationId: org.organizationId,
      ...(departmentId ? { departmentId } : {}),
      ...(active === "true" ? { isActive: true } : {}),
      ...(active === "false" ? { isActive: false } : {}),
      ...(approval ? { approvalStatus: approval as "PENDING" | "APPROVED" | "REJECTED" } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { designation: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    select: workerSelect,
    orderBy: [{ approvalStatus: "asc" }, { isActive: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ workers: workers.map(toClientWorker) });
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  departmentId: z.string().min(1, "Department is required"),
  designation: z.string().trim().max(60).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  pin: z.string().regex(PIN_PATTERN, "PIN must be 4 to 6 digits").optional().or(z.literal("")),
  joiningDate: z.string().optional(),
  monthlySalary: z.coerce.number().nonnegative().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const department = await prisma.department.findFirst({
    where: { id: parsed.data.departmentId, organizationId: org.organizationId },
  });
  if (!department) {
    return NextResponse.json({ error: "Selected department does not exist" }, { status: 400 });
  }

  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;

  if (parsed.data.pin) {
    if (!phone) {
      return NextResponse.json({ error: "A phone number is required to set a login PIN" }, { status: 400 });
    }
    const existingLogin = await prisma.worker.findFirst({
      where: { organizationId: org.organizationId, phone, pinHash: { not: null } },
    });
    if (existingLogin) {
      return NextResponse.json(
        { error: "Another worker already uses this phone number to log in" },
        { status: 409 }
      );
    }
  }

  const worker = await prisma.worker.create({
    data: {
      name: parsed.data.name,
      departmentId: parsed.data.departmentId,
      organizationId: org.organizationId,
      designation: parsed.data.designation || null,
      phone,
      pinHash: parsed.data.pin ? await hashPin(parsed.data.pin) : null,
      joiningDate: parsed.data.joiningDate ? new Date(parsed.data.joiningDate) : new Date(),
      monthlySalary: parsed.data.monthlySalary ?? null,
      approvalStatus: "APPROVED",
      source: "ADMIN",
    },
    select: workerSelect,
  });

  return NextResponse.json({ worker: toClientWorker(worker) }, { status: 201 });
}
