import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";
import { hashPin, normalizePhone, PIN_PATTERN } from "@/lib/worker-auth";
import { workerSelect, toClientWorker } from "@/lib/worker-select";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  departmentId: z.string().min(1).optional(),
  designation: z.string().trim().max(60).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  joiningDate: z.string().optional(),
  isActive: z.boolean().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  pin: z.union([z.string().regex(PIN_PATTERN, "PIN must be 4 to 6 digits"), z.null()]).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.worker.findFirst({
    where: { id, organizationId: org.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  if (parsed.data.departmentId) {
    const department = await prisma.department.findFirst({
      where: { id: parsed.data.departmentId, organizationId: org.organizationId },
    });
    if (!department) {
      return NextResponse.json({ error: "Selected department does not exist" }, { status: 400 });
    }
  }

  const { joiningDate, phone: rawPhone, pin, ...rest } = parsed.data;
  const phone = rawPhone !== undefined ? (rawPhone ? normalizePhone(rawPhone) : null) : undefined;

  // Resolve what phone + PIN this worker will end up with, so we can check
  // for a login collision whenever either one changes.
  const finalPhone = phone !== undefined ? phone : existing.phone;
  const willHavePin = pin !== undefined ? pin !== null : existing.pinHash !== null;

  if (willHavePin) {
    if (!finalPhone) {
      return NextResponse.json({ error: "A phone number is required to set a login PIN" }, { status: 400 });
    }
    const collision = await prisma.worker.findFirst({
      where: {
        organizationId: org.organizationId,
        phone: finalPhone,
        pinHash: { not: null },
        NOT: { id },
      },
    });
    if (collision) {
      return NextResponse.json(
        { error: "Another worker already uses this phone number to log in" },
        { status: 409 }
      );
    }
  }

  const worker = await prisma.worker.update({
    where: { id },
    data: {
      ...rest,
      ...(phone !== undefined ? { phone } : {}),
      ...(pin !== undefined ? { pinHash: pin === null ? null : await hashPin(pin) } : {}),
      ...(joiningDate ? { joiningDate: new Date(joiningDate) } : {}),
    },
    select: workerSelect,
  });
  return NextResponse.json({ worker: toClientWorker(worker) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.worker.findFirst({
    where: { id, organizationId: org.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  await prisma.worker.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
