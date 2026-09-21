import { prisma } from "@/lib/prisma";
import { addDaysToKey, dateKeyToUTC, todayKey, utcToDateKey } from "@/lib/date";
import { VERIFIED_ATTENDANCE_WHERE } from "@/lib/attendance-filter";

export async function getAttendanceSummary(organizationId: string, days = 14) {
  const clampedDays = Math.min(Math.max(days, 1), 90);
  const todayDateKey = todayKey();
  const fromKey = addDaysToKey(todayDateKey, -(clampedDays - 1));
  const fromDate = dateKeyToUTC(fromKey);
  const toDate = dateKeyToUTC(todayDateKey);

  const [totalActiveWorkers, departments, records] = await Promise.all([
    prisma.worker.count({
      where: { organizationId, isActive: true, approvalStatus: "APPROVED" },
    }),
    prisma.department.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { workers: { where: { isActive: true, approvalStatus: "APPROVED" } } },
        },
      },
    }),
    prisma.attendanceRecord.findMany({
      where: { organizationId, date: { gte: fromDate, lte: toDate }, ...VERIFIED_ATTENDANCE_WHERE },
      include: { worker: { select: { departmentId: true, isActive: true } } },
    }),
  ]);

  const trendMap = new Map<
    string,
    { present: number; absent: number; halfDay: number; leave: number; holiday: number }
  >();
  for (let i = 0; i < clampedDays; i++) {
    const key = addDaysToKey(fromKey, i);
    trendMap.set(key, { present: 0, absent: 0, halfDay: 0, leave: 0, holiday: 0 });
  }

  const todayRecords: typeof records = [];

  for (const rec of records) {
    const key = utcToDateKey(rec.date);
    const bucket = trendMap.get(key);
    if (bucket) {
      if (rec.status === "PRESENT") bucket.present++;
      else if (rec.status === "ABSENT") bucket.absent++;
      else if (rec.status === "HALF_DAY") bucket.halfDay++;
      else if (rec.status === "LEAVE") bucket.leave++;
      else if (rec.status === "HOLIDAY") bucket.holiday++;
    }
    if (key === todayDateKey) todayRecords.push(rec);
  }

  const trend = Array.from(trendMap.entries()).map(([date, counts]) => {
    const marked = counts.present + counts.absent + counts.halfDay + counts.leave + counts.holiday;
    const presentPct = marked > 0 ? Math.round((counts.present / marked) * 1000) / 10 : 0;
    return { date, ...counts, presentPct };
  });

  const today = {
    date: todayDateKey,
    totalWorkers: totalActiveWorkers,
    present: todayRecords.filter((r) => r.status === "PRESENT").length,
    absent: todayRecords.filter((r) => r.status === "ABSENT").length,
    halfDay: todayRecords.filter((r) => r.status === "HALF_DAY").length,
    leave: todayRecords.filter((r) => r.status === "LEAVE").length,
    holiday: todayRecords.filter((r) => r.status === "HOLIDAY").length,
    unmarked: Math.max(totalActiveWorkers - todayRecords.length, 0),
  };

  const deptBreakdown = departments.map((dept) => {
    const deptRecordsToday = todayRecords.filter((r) => r.worker.departmentId === dept.id);
    const totalWorkers = dept._count.workers;
    const present = deptRecordsToday.filter((r) => r.status === "PRESENT").length;
    const absent = deptRecordsToday.filter((r) => r.status === "ABSENT").length;
    const halfDay = deptRecordsToday.filter((r) => r.status === "HALF_DAY").length;
    const leave = deptRecordsToday.filter((r) => r.status === "LEAVE").length;
    const presentPct = totalWorkers > 0 ? Math.round((present / totalWorkers) * 1000) / 10 : 0;

    return {
      id: dept.id,
      name: dept.name,
      color: dept.color,
      totalWorkers,
      present,
      absent,
      halfDay,
      leave,
      presentPct,
    };
  });

  return { today, trend, departments: deptBreakdown };
}

export type AttendanceSummary = Awaited<ReturnType<typeof getAttendanceSummary>>;
