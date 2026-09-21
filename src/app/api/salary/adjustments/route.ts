import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const createSchema = z.object({
  workerId: z.string().min(1),
  month: z.string().regex(MONTH_KEY_PATTERN, "Invalid month"),
  amount: z.coerce.number().refine((n) => n !== 0, "Amount cannot be zero"),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const worker = await prisma.worker.findFirst({
    where: { id: parsed.data.workerId, organizationId: org.organizationId },
  });
  if (!worker) {
    return NextResponse.json({ error: "Worker not found" }, { status: 404 });
  }

  const adjustment = await prisma.salaryAdjustment.create({
    data: {
      workerId: parsed.data.workerId,
      organizationId: org.organizationId,
      month: parsed.data.month,
      amount: parsed.data.amount,
      reason: parsed.data.reason || null,
    },
  });

  return NextResponse.json(
    {
      adjustment: {
        id: adjustment.id,
        amount: adjustment.amount,
        reason: adjustment.reason,
        createdAt: adjustment.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
