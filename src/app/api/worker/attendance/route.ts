import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getWorkerSession } from "@/lib/session";
import { addDaysToKey, dateKeyToUTC, daysInMonthKey, monthKeyRange, todayKey, utcToDateKey } from "@/lib/date";
import type { AttendanceStatus, AttendanceVerificationStatus } from "@prisma/client";

// Workers can only self-mark these — HOLIDAY stays an admin-only declaration.
const SELF_MARK_STATUSES = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"] as const;
const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET(request: NextRequest) {
  const worker = await getWorkerSession();
  if (!worker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const monthParam = searchParams.get("month");

  // Full-month view for the calendar: returns every record in that month as a
  // dateKey -> {status, verificationStatus} map, regardless of the "days"
  // window used below. Every record here is the worker's own, pending or not —
  // they should always see what they submitted and whether it's confirmed yet.
  if (monthParam && MONTH_KEY_PATTERN.test(monthParam)) {
    const { from, to } = monthKeyRange(monthParam);
    const records = await prisma.attendanceRecord.findMany({
      where: { workerId: worker.workerId, date: { gte: dateKeyToUTC(from), lte: dateKeyToUTC(to) } },
    });
    const dayRecords: Record<string, { status: AttendanceStatus; verificationStatus: AttendanceVerificationStatus | null }> = {};
    for (const r of records) dayRecords[utcToDateKey(r.date)] = { status: r.status, verificationStatus: r.verificationStatus };
    return NextResponse.json({ month: monthParam, daysInMonth: daysInMonthKey(monthParam), records: dayRecords });
  }

  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 90);

  const todayDateKey = todayKey();
  const fromKey = addDaysToKey(todayDateKey, -(days - 1));
  const fromDate = dateKeyToUTC(fromKey);
  const toDate = dateKeyToUTC(todayDateKey);

  const records = await prisma.attendanceRecord.findMany({
    where: { workerId: worker.workerId, date: { gte: fromDate, lte: toDate } },
    orderBy: { date: "desc" },
  });

  const history = records.map((r) => ({
    date: utcToDateKey(r.date),
    status: r.status,
    verificationStatus: r.verificationStatus,
  }));
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

  // A worker's self-mark always starts (or resets to) PENDING — it needs a
  // manager to verify it before it counts toward stats, reports or salary,
  // even if it's overwriting a status they'd already submitted.
  const record = await prisma.attendanceRecord.upsert({
    where: { workerId_date: { workerId: worker.workerId, date } },
    update: {
      status: parsed.data.status as AttendanceStatus,
      markedAt: new Date(),
      markedBySelf: true,
      verificationStatus: "PENDING",
    },
    create: {
      workerId: worker.workerId,
      organizationId: worker.organizationId,
      date,
      status: parsed.data.status as AttendanceStatus,
      markedBySelf: true,
      verificationStatus: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, status: record.status, verificationStatus: record.verificationStatus });
}
