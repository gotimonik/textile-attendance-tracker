import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateKeyToUTC, todayKey, utcToDateKey, addDaysToKey } from "@/lib/date";
import { STATUS_LABELS } from "@/lib/colors";
import { getOrgSession } from "@/lib/session";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const departmentId = searchParams.get("departmentId") || undefined;
  const toKey = searchParams.get("to") || todayKey();
  const fromKey = searchParams.get("from") || addDaysToKey(toKey, -29);

  const fromDate = dateKeyToUTC(fromKey);
  const toDate = dateKeyToUTC(toKey);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      organizationId: org.organizationId,
      date: { gte: fromDate, lte: toDate },
      ...(departmentId ? { worker: { departmentId } } : {}),
    },
    include: { worker: { include: { department: true } } },
    orderBy: [{ date: "asc" }, { worker: { name: "asc" } }],
  });

  const header = ["Date", "Worker Name", "Department", "Designation", "Status", "Remarks"];
  const rows = records.map((r) =>
    [
      utcToDateKey(r.date),
      r.worker.name,
      r.worker.department.name,
      r.worker.designation ?? "",
      STATUS_LABELS[r.status],
      r.remarks ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");
  const filename = `attendance_${fromKey}_to_${toKey}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
