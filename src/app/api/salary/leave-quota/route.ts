import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const grantSchema = z.object({
  month: z.string().regex(MONTH_KEY_PATTERN, "Invalid month"),
  workerIds: z.array(z.string().min(1)).min(1).max(1000),
  quota: z.coerce.number().int().min(0).max(31),
});

/** Admin-only: grant N paid leaves for one month to one or more selected
 * workers (or every worker in the org, when the caller passes all their ids).
 * No grant for a worker+month means 0 paid leaves — this is how paid leave is
 * switched on, explicitly, per worker per month. */
export async function POST(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const workerIds = [...new Set(parsed.data.workerIds)];
  const ownedWorkers = await prisma.worker.findMany({
    where: { id: { in: workerIds }, organizationId: org.organizationId },
    select: { id: true },
  });
  const ownedIds = new Set(ownedWorkers.map((w) => w.id));
  const invalid = workerIds.filter((id) => !ownedIds.has(id));
  if (invalid.length > 0) {
    return NextResponse.json({ error: "One or more workers do not belong to this organization" }, { status: 400 });
  }

  await prisma.$transaction(
    workerIds.map((workerId) =>
      prisma.paidLeaveGrant.upsert({
        where: { workerId_month: { workerId, month: parsed.data.month } },
        update: { quota: parsed.data.quota },
        create: {
          workerId,
          organizationId: org.organizationId,
          month: parsed.data.month,
          quota: parsed.data.quota,
        },
      })
    )
  );

  return NextResponse.json({ ok: true, count: workerIds.length });
}
