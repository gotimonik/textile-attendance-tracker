import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const createSchema = z.object({
  workerId: z.string().min(1),
  month: z.string().regex(MONTH_KEY_PATTERN, "Invalid month"),
  amount: z.coerce.number().nonnegative(),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

/** Admin-only: mark a worker's payroll for a month as paid (creates or replaces the record for that worker+month). */
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

  const payment = await prisma.salaryPayment.upsert({
    where: { workerId_month: { workerId: parsed.data.workerId, month: parsed.data.month } },
    update: { amount: parsed.data.amount, note: parsed.data.note || null, paidAt: new Date() },
    create: {
      workerId: parsed.data.workerId,
      organizationId: org.organizationId,
      month: parsed.data.month,
      amount: parsed.data.amount,
      note: parsed.data.note || null,
    },
  });

  return NextResponse.json(
    {
      payment: {
        id: payment.id,
        amount: payment.amount,
        note: payment.note,
        paidAt: payment.paidAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
