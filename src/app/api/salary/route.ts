import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOrgSession } from "@/lib/session";
import { getSalaryBreakdown } from "@/lib/salary";
import { currentMonthKey } from "@/lib/date";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function GET(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const monthParam = searchParams.get("month") || currentMonthKey();
  const month = MONTH_KEY_PATTERN.test(monthParam) ? monthParam : currentMonthKey();
  const departmentId = searchParams.get("departmentId") || undefined;

  const { settings, daysInMonth, rows } = await getSalaryBreakdown(org.organizationId, month, departmentId);

  return NextResponse.json({ month, settings, daysInMonth, rows });
}
