import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateKeyToUTC, todayKey, addDaysToKey } from "@/lib/date";
import { getOrgSession } from "@/lib/session";
import { VERIFIED_ATTENDANCE_WHERE } from "@/lib/attendance-filter";

export async function GET(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const departmentId = searchParams.get("departmentId") || undefined;
  const toKey = searchParams.get("to") || todayKey();
  const fromKey = searchParams.get("from") || addDaysToKey(toKey, -29);

  const fromDate = dateKeyToUTC(fromKey);
  const toDate = dateKeyToUTC(toKey);

  const workers = await prisma.worker.findMany({
    where: {
      organizationId: org.organizationId,
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: true,
      attendance: {
        where: { date: { gte: fromDate, lte: toDate }, ...VERIFIED_ATTENDANCE_WHERE },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = workers.map((w) => {
    const present = w.attendance.filter((r) => r.status === "PRESENT").length;
    const absent = w.attendance.filter((r) => r.status === "ABSENT").length;
    const halfDay = w.attendance.filter((r) => r.status === "HALF_DAY").length;
    const leave = w.attendance.filter((r) => r.status === "LEAVE").length;
    const holiday = w.attendance.filter((r) => r.status === "HOLIDAY").length;
    const markedDays = present + absent + halfDay + leave; // holidays excluded from denominator
    const presentEquivalent = present + halfDay * 0.5;
    const attendancePct = markedDays > 0 ? Math.round((presentEquivalent / markedDays) * 1000) / 10 : 0;

    return {
      workerId: w.id,
      name: w.name,
      department: { id: w.department.id, name: w.department.name, color: w.department.color },
      isActive: w.isActive,
      present,
      absent,
      halfDay,
      leave,
      holiday,
      markedDays,
      attendancePct,
    };
  });

  return NextResponse.json({ from: fromKey, to: toKey, rows });
}
