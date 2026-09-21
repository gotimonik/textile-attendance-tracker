import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dateKeyToUTC } from "@/lib/date";
import type { AttendanceStatus } from "@prisma/client";
import { getOrgSession } from "@/lib/session";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const bulkSchema = z.object({
  dates: z.array(z.string().regex(DATE_KEY_PATTERN)).min(1).max(62),
  workerIds: z.array(z.string()).min(1).max(500),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"]),
});

/** Mark the same status for many workers across many dates in one action
 * (e.g. mark a whole week of Leave for one worker, or a festival week of
 * Holiday for everyone). Upserts on the same `workerId_date` key as the
 * single-date endpoint. */
export async function POST(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
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

  const dates = [...new Set(parsed.data.dates)];
  const status = parsed.data.status as AttendanceStatus;

  const operations = [];
  for (const dateKey of dates) {
    const date = dateKeyToUTC(dateKey);
    for (const workerId of workerIds) {
      operations.push(
        prisma.attendanceRecord.upsert({
          where: { workerId_date: { workerId, date } },
          update: { status, markedAt: new Date(), markedBySelf: false, verificationStatus: null },
          create: { workerId, date, status, organizationId: org.organizationId, markedBySelf: false, verificationStatus: null },
        })
      );
    }
  }

  // Chunk the transaction so very large bulk actions (e.g. 62 days x many
  // workers) don't exceed a single transaction's practical size.
  const CHUNK_SIZE = 200;
  let count = 0;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    await prisma.$transaction(chunk);
    count += chunk.length;
  }

  return NextResponse.json({ ok: true, count });
}
