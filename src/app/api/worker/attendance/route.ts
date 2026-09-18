import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getWorkerSession } from "@/lib/session";
import { addDaysToKey, dateKeyToUTC, todayKey, utcToDateKey } from "@/lib/date";
import type { AttendanceStatus } from "@prisma/client";

// Workers can only self-mark these — HOLIDAY stays an admin-only declaration.
const SELF_MARK_STATUSES = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"] as const;

export async function GET(request: NextRequest) {
  const worker = await getWorkerSession();
  if (!worker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 90);

  const todayDateKey = todayKey();
  const fromKey = addDaysToKey(todayDateKey, -(days - 1));
  const fromDate = dateKeyToUTC(fromKey);
  const toDate = dateKeyToUTC(todayDateKey);

  const records = await prisma.attendanceRecord.findMany({
    where: { workerId: worker.workerId, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "desc" },
  });

  const history = records.map((r) => ({ date: utcToDateKey(r.date), status: r.status }));
  const today = history.find((r) => r.date === todayDateKey) ?? null;

  return NextResponse.json({ today, history });
}

const markSchema = z.object({
  status: z.enum(SELF_MARK_STATUSES),
});

export async function POST(request: NextRequest) {
  const worker = await getWorkerSession();
  if (!worker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Always today's date, server-side — a worker cannot backdate or postdate
  // their own attendance through this endpoint.
  const date = dateKeyToUTC(todayKey());

  const record = await prisma.attendanceRecord.upsert({
    where: { workerId_date: { workerId: worker.workerId, date } },
    update: { status: parsed.data.status as AttendanceStatus, markedAt: new Date() },
    create: {
      workerId: worker.workerId,
      organizationId: worker.organizationId,
      date,
      status: parsed.data.status as AttendanceStatus,
    },
  });

  return NextResponse.json({ ok: true, status: record.status });
}
