import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAttendanceSummary } from "@/lib/attendance-summary";
import { getOrgSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const days = Number(searchParams.get("days")) || 14;
  const summary = await getAttendanceSummary(org.organizationId, days);
  return NextResponse.json(summary);
}
