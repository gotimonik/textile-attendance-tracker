import { prisma } from "@/lib/prisma";
import {
  dateKeyToUTC,
  daysInMonthKey,
  monthKeyOf,
  monthKeyRange,
  monthKeysBetween,
  todayKey,
  utcToDateKey,
} from "@/lib/date";
import { VERIFIED_ATTENDANCE_WHERE } from "@/lib/attendance-filter";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Pure per-month payroll math, shared by the org-wide monthly breakdown and the
 * per-worker historical ledger so both apply the exact same rule.
 *
 * Deduction rule: Absent = 1 full day, Half Day = 0.5 day. No Leave is paid by
 * default — a worker only keeps pay for Leave days up to whatever paid-leave
 * quota an admin has granted them for that specific month (0 if none was
 * granted). Leave beyond the quota deducts a full day too, same as Absent —
 * admins can always add a manual adjustment to override this for a specific
 * case.
 *
 * Divisor rule: `organization.salaryDivisorDays` if set, otherwise the actual
 * number of calendar days in the month.
 */
function calcMonthBreakdown({
  monthlySalary,
  daysInMonth,
  absent,
  halfDay,
  leave,
  paidLeaveQuota,
  adjustmentsTotal,
}: {
  monthlySalary: number | null;
  daysInMonth: number;
  absent: number;
  halfDay: number;
  leave: number;
  paidLeaveQuota: number;
  adjustmentsTotal: number;
}) {
  const excessLeaveDays = Math.max(0, leave - paidLeaveQuota);
  const deductionDays = absent + halfDay * 0.5 + excessLeaveDays;
  const perDayRate = monthlySalary != null ? monthlySalary / daysInMonth : null;
  const attendanceDeduction = perDayRate != null ? round2(perDayRate * deductionDays) : 0;
  const netSalary = monthlySalary != null ? round2(monthlySalary - attendanceDeduction + adjustmentsTotal) : null;
  return {
    excessLeaveDays,
    deductionDays,
    perDayRate: perDayRate != null ? round2(perDayRate) : null,
    attendanceDeduction,
    netSalary,
  };
}

export type WorkerSalaryBreakdown = {
  workerId: string;
  name: string;
  isActive: boolean;
  department: { id: string; name: string; color: string };
  monthlySalary: number | null;
  paidLeaveQuota: number;
  daysInMonth: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  markedDays: number;
  excessLeaveDays: number;
  deductionDays: number;
  perDayRate: number | null;
  attendanceDeduction: number;
  adjustmentsTotal: number;
  adjustments: { id: string; amount: number; reason: string | null; createdAt: string }[];
  netSalary: number | null;
  isPaid: boolean;
  paymentId: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  paymentNote: string | null;
};

export type SalarySettings = { salaryDivisorDays: number | null };

/**
 * Per-worker payroll breakdown for one "YYYY-MM" month, scoped to an organization.
 */
export async function getSalaryBreakdown(
  organizationId: string,
  monthKey: string,
  departmentId?: string
): Promise<{ settings: SalarySettings; daysInMonth: number; rows: WorkerSalaryBreakdown[] }> {
  const { from, to } = monthKeyRange(monthKey);
  const fromDate = dateKeyToUTC(from);
  const toDate = dateKeyToUTC(to);

  const [organization, workers] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { salaryDivisorDays: true },
    }),
    prisma.worker.findMany({
      where: {
        organizationId,
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: true,
        attendance: { where: { date: { gte: fromDate, lte: toDate }, ...VERIFIED_ATTENDANCE_WHERE } },
        salaryAdjustments: { where: { month: monthKey }, orderBy: { createdAt: "desc" } },
        salaryPayments: { where: { month: monthKey } },
        paidLeaveGrants: { where: { month: monthKey } },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
  ]);

  const daysInMonth = organization?.salaryDivisorDays ?? daysInMonthKey(monthKey);

  const rows: WorkerSalaryBreakdown[] = workers.map((w) => {
    const present = w.attendance.filter((r) => r.status === "PRESENT").length;
    const absent = w.attendance.filter((r) => r.status === "ABSENT").length;
    const halfDay = w.attendance.filter((r) => r.status === "HALF_DAY").length;
    const leave = w.attendance.filter((r) => r.status === "LEAVE").length;
    const holiday = w.attendance.filter((r) => r.status === "HOLIDAY").length;
    const markedDays = present + absent + halfDay + leave + holiday;

    const paidLeaveQuota = w.paidLeaveGrants[0]?.quota ?? 0;
    const adjustmentsTotal = round2(w.salaryAdjustments.reduce((sum, a) => sum + a.amount, 0));
    const calc = calcMonthBreakdown({
      monthlySalary: w.monthlySalary,
      daysInMonth,
      absent,
      halfDay,
      leave,
      paidLeaveQuota,
      adjustmentsTotal,
    });
    const payment = w.salaryPayments[0] ?? null;

    return {
      workerId: w.id,
      name: w.name,
      isActive: w.isActive,
      department: { id: w.department.id, name: w.department.name, color: w.department.color },
      monthlySalary: w.monthlySalary,
      paidLeaveQuota,
      daysInMonth,
      present,
      absent,
      halfDay,
      leave,
      holiday,
      markedDays,
      excessLeaveDays: calc.excessLeaveDays,
      deductionDays: calc.deductionDays,
      perDayRate: calc.perDayRate,
      attendanceDeduction: calc.attendanceDeduction,
      adjustmentsTotal,
      adjustments: w.salaryAdjustments.map((a) => ({
        id: a.id,
        amount: a.amount,
        reason: a.reason,
        createdAt: a.createdAt.toISOString(),
      })),
      netSalary: calc.netSalary,
      isPaid: payment != null,
      paymentId: payment?.id ?? null,
      paidAmount: payment?.amount ?? null,
      paidAt: payment?.paidAt.toISOString() ?? null,
      paymentNote: payment?.note ?? null,
    };
  });

  return {
    settings: { salaryDivisorDays: organization?.salaryDivisorDays ?? null },
    daysInMonth,
    rows,
  };
}

export type WorkerLedgerMonth = {
  month: string;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  paidLeaveQuota: number;
  excessLeaveDays: number;
  deductionDays: number;
  daysInMonth: number;
  perDayRate: number | null;
  attendanceDeduction: number;
  adjustmentsTotal: number;
  estimatedNetSalary: number | null;
  isPaid: boolean;
  paidAmount: number | null;
  paidAt: string | null;
  paymentNote: string | null;
};

/**
 * A single worker's own payroll history — one row per month from the month they
 * joined through the current month. Used for the worker-facing "my salary" view.
 * Applies the organization's *current* salary divisor and each month's own
 * granted paid-leave quota to the worker's *current* monthlySalary, same as the
 * rest of this app's point-in-time-unaware settings model.
 */
export async function getWorkerSalaryLedger(
  organizationId: string,
  workerId: string
): Promise<{ monthlySalary: number | null; months: WorkerLedgerMonth[] } | null> {
  const worker = await prisma.worker.findFirst({
    where: { id: workerId, organizationId },
    select: { monthlySalary: true, joiningDate: true },
  });
  if (!worker) return null;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { salaryDivisorDays: true },
  });

  const startMonth = monthKeyOf(utcToDateKey(worker.joiningDate));
  const endMonth = monthKeyOf(todayKey());
  const monthKeys = monthKeysBetween(startMonth, endMonth);

  const rangeFrom = dateKeyToUTC(monthKeyRange(startMonth).from);
  const rangeTo = dateKeyToUTC(monthKeyRange(endMonth).to);

  const [records, adjustments, payments, grants] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { workerId, date: { gte: rangeFrom, lte: rangeTo }, ...VERIFIED_ATTENDANCE_WHERE },
    }),
    prisma.salaryAdjustment.findMany({
      where: { workerId, month: { in: monthKeys } },
    }),
    prisma.salaryPayment.findMany({
      where: { workerId, month: { in: monthKeys } },
    }),
    prisma.paidLeaveGrant.findMany({
      where: { workerId, month: { in: monthKeys } },
    }),
  ]);

  const months: WorkerLedgerMonth[] = monthKeys
    .map((month) => {
      const { from, to } = monthKeyRange(month);
      const monthRecords = records.filter((r) => {
        const k = utcToDateKey(r.date);
        return k >= from && k <= to;
      });
      const present = monthRecords.filter((r) => r.status === "PRESENT").length;
      const absent = monthRecords.filter((r) => r.status === "ABSENT").length;
      const halfDay = monthRecords.filter((r) => r.status === "HALF_DAY").length;
      const leave = monthRecords.filter((r) => r.status === "LEAVE").length;
      const holiday = monthRecords.filter((r) => r.status === "HOLIDAY").length;

      const daysInMonth = organization?.salaryDivisorDays ?? daysInMonthKey(month);
      const adjustmentsTotal = round2(
        adjustments.filter((a) => a.month === month).reduce((sum, a) => sum + a.amount, 0)
      );
      const paidLeaveQuota = grants.find((g) => g.month === month)?.quota ?? 0;
      const calc = calcMonthBreakdown({
        monthlySalary: worker.monthlySalary,
        daysInMonth,
        absent,
        halfDay,
        leave,
        paidLeaveQuota,
        adjustmentsTotal,
      });
      const payment = payments.find((p) => p.month === month) ?? null;

      return {
        month,
        present,
        absent,
        halfDay,
        leave,
        holiday,
        paidLeaveQuota,
        excessLeaveDays: calc.excessLeaveDays,
        deductionDays: calc.deductionDays,
        daysInMonth,
        perDayRate: calc.perDayRate,
        attendanceDeduction: calc.attendanceDeduction,
        adjustmentsTotal,
        estimatedNetSalary: calc.netSalary,
        isPaid: payment != null,
        paidAmount: payment?.amount ?? null,
        paidAt: payment?.paidAt.toISOString() ?? null,
        paymentNote: payment?.note ?? null,
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month));

  return { monthlySalary: worker.monthlySalary, months };
}
