import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";

const verifySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

/** Admin-only: approve or reject one or more pending self-marked records at
 * once. Approved records start counting toward stats, reports and salary;
 * rejected ones stay excluded, same as if never marked. */
export async function POST(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const result = await prisma.attendanceRecord.updateMany({
    where: {
      id: { in: parsed.data.ids },
      organizationId: org.organizationId,
      verificationStatus: "PENDING",
    },
    data: { verificationStatus: parsed.data.decision },
  });

  return NextResponse.json({ ok: true, count: result.count });
}
