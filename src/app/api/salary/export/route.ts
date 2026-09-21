import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getOrgSession } from "@/lib/session";
import { getSalaryBreakdown } from "@/lib/salary";
import { currentMonthKey } from "@/lib/date";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

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
  const monthParam = searchParams.get("month") || currentMonthKey();
  const month = MONTH_KEY_PATTERN.test(monthParam) ? monthParam : currentMonthKey();
  const departmentId = searchParams.get("departmentId") || undefined;

  const { rows } = await getSalaryBreakdown(org.organizationId, month, departmentId);

  const header = [
    "Worker Name",
    "Department",
    "Monthly Salary",
    "Days In Month",
    "Present",
    "Absent",
    "Half Day",
    "Leave",
    "Paid Leave Quota",
    "Excess Leave",
    "Holiday",
    "Deduction Days",
    "Attendance Deduction",
    "Adjustments Total",
    "Net Salary",
    "Paid",
    "Paid Amount",
    "Paid At",
  ];

  const csvRows = rows.map((r) =>
    [
      r.name,
      r.department.name,
      r.monthlySalary ?? "",
      r.daysInMonth,
      r.present,
      r.absent,
      r.halfDay,
      r.leave,
      r.paidLeaveQuota,
      r.excessLeaveDays,
      r.holiday,
      r.deductionDays,
      r.attendanceDeduction,
      r.adjustmentsTotal,
      r.netSalary ?? "",
      r.isPaid ? "Yes" : "No",
      r.paidAmount ?? "",
      r.paidAt ? r.paidAt.slice(0, 10) : "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...csvRows].join("\n");
  const filename = `salary_${month}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
