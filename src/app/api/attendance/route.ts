import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dateKeyToUTC, todayKey } from "@/lib/date";
import type { AttendanceStatus } from "@prisma/client";
import { getOrgSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const dateKey = searchParams.get("date") || todayKey();
  const date = dateKeyToUTC(dateKey);

  const departments = await prisma.department.findMany({
    where: { organizationId: org.organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      workers: {
        where: { isActive: true, approvalStatus: "APPROVED" },
        orderBy: { name: "asc" },
        include: {
          attendance: {
            where: { date },
          },
        },
      },
    },
  });

  const payload = departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    color: dept.color,
    workers: dept.workers.map((w) => ({
      id: w.id,
      name: w.name,
      designation: w.designation,
      status: w.attendance[0]?.status ?? null,
      // Surfaced so the marking UI can flag a worker's own pending self-mark —
      // it's shown here for review, but doesn't count anywhere until an admin
      // action (like Save on this screen) confirms it.
      pending: w.attendance[0]?.verificationStatus === "PENDING",
    })),
  }));

  return NextResponse.json({ date: dateKey, departments: payload });
}

const recordSchema = z.object({
  workerId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"]),
});

const bulkSchema = z.object({
  date: z.string(),
  records: z.array(recordSchema).min(1),
});

export async function POST(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const workerIds = [...new Set(parsed.data.records.map((r) => r.workerId))];
  const ownedWorkers = await prisma.worker.findMany({
    where: { id: { in: workerIds }, organizationId: org.organizationId },
    select: { id: true },
  });
  const ownedIds = new Set(ownedWorkers.map((w) => w.id));
  const invalid = workerIds.filter((id) => !ownedIds.has(id));
  if (invalid.length > 0) {
    return NextResponse.json({ error: "One or more workers do not belong to this organization" }, { status: 400 });
  }

  const date = dateKeyToUTC(parsed.data.date);

  // An admin saving this screen is itself the confirmation — clear any pending
  // self-mark state so the record counts immediately, without a separate trip
  // through the Pending tab.
  await prisma.$transaction(
    parsed.data.records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { workerId_date: { workerId: r.workerId, date } },
        update: { status: r.status as AttendanceStatus, markedAt: new Date(), markedBySelf: false, verificationStatus: null },
        create: {
          workerId: r.workerId,
          date,
          status: r.status as AttendanceStatus,
          organizationId: org.organizationId,
          markedBySelf: false,
          verificationStatus: null,
        },
      })
    )
  );

  return NextResponse.json({ ok: true, count: parsed.data.records.length });
}
