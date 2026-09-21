import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateKeyToUTC, todayKey, addDaysToKey, utcToDateKey } from "@/lib/date";
import { getOrgSession } from "@/lib/session";

/** A per-worker-per-date status matrix for a date range — powers the Week/Month
 * read-only attendance grid (as opposed to /api/attendance, which is scoped to
 * a single date for the day-marking view). */
export async function GET(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const departmentId = searchParams.get("departmentId") || undefined;
  const toKey = searchParams.get("to") || todayKey();
  const fromKey = searchParams.get("from") || addDaysToKey(toKey, -6);

  const fromDate = dateKeyToUTC(fromKey);
  const toDate = dateKeyToUTC(toKey);

  const departments = await prisma.department.findMany({
    where: { organizationId: org.organizationId, ...(departmentId ? { id: departmentId } : {}) },
    orderBy: { createdAt: "asc" },
    include: {
      workers: {
        where: { isActive: true, approvalStatus: "APPROVED" },
        orderBy: { name: "asc" },
        include: {
          attendance: { where: { date: { gte: fromDate, lte: toDate } } },
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
      records: Object.fromEntries(
        w.attendance.map((r) => [utcToDateKey(r.date), { status: r.status, pending: r.verificationStatus === "PENDING" }])
      ),
    })),
  }));

  return NextResponse.json({ from: fromKey, to: toKey, departments: payload });
}
