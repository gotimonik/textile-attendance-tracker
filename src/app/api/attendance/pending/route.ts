import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";
import { utcToDateKey } from "@/lib/date";

/** Admin-only: every self-marked attendance record still awaiting review,
 * across all workers and dates — the queue behind the Pending tab. */
export async function GET() {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.attendanceRecord.findMany({
    where: { organizationId: org.organizationId, verificationStatus: "PENDING" },
    include: { worker: { include: { department: true } } },
    orderBy: [{ date: "desc" }, { markedAt: "desc" }],
  });

  const rows = records.map((r) => ({
    id: r.id,
    date: utcToDateKey(r.date),
    status: r.status,
    markedAt: r.markedAt.toISOString(),
    workerId: r.worker.id,
    workerName: r.worker.name,
    department: { id: r.worker.department.id, name: r.worker.department.name, color: r.worker.department.color },
  }));

  return NextResponse.json({ rows });
}
