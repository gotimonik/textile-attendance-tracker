"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Download, IndianRupee, Wallet, Settings2, Plus, Loader2, CheckCircle2, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepartmentBadge } from "@/components/department-badge";
import { SetSalaryDialog, type SalaryTarget } from "@/components/salary/set-salary-dialog";
import { SalaryAdjustmentDialog, type AdjustmentTarget } from "@/components/salary/salary-adjustment-dialog";
import { MarkPaidDialog, type PaidTarget } from "@/components/salary/mark-paid-dialog";
import { PaidLeaveGrantDialog } from "@/components/salary/paid-leave-grant-dialog";
import { currentMonthKey, addMonthsToKey, formatMonthLabel } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type DepartmentOption = { id: string; name: string; color: string };

type Adjustment = { id: string; amount: number; reason: string | null; createdAt: string };

type SalaryRow = {
  workerId: string;
  name: string;
  isActive: boolean;
  department: { id: string; name: string; color: string };
  monthlySalary: number | null;
  paidLeaveQuota: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  excessLeaveDays: number;
  deductionDays: number;
  attendanceDeduction: number;
  adjustmentsTotal: number;
  adjustments: Adjustment[];
  netSalary: number | null;
  isPaid: boolean;
  paymentId: string | null;
  paidAmount: number | null;
  paidAt: string | null;
  paymentNote: string | null;
};

function money(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function SalaryView({ departments }: { departments: DepartmentOption[] }) {
  const { t } = useTranslation();
  // Starts null and is set client-side only (never during the server render) —
  // `currentMonthKey()` depends on the viewer's local timezone, which can differ
  // from the server's, so computing it during SSR would produce a hydration
  // mismatch for anyone not in the server's timezone.
  const [month, setMonth] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState("all");
  const [rows, setRows] = useState<SalaryRow[] | null>(null);
  const [daysInMonth, setDaysInMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [divisorMode, setDivisorMode] = useState<"calendar" | "fixed">("calendar");
  const [divisorValue, setDivisorValue] = useState("26");
  const [grantOpen, setGrantOpen] = useState(false);

  const [salaryTarget, setSalaryTarget] = useState<SalaryTarget>(null);
  const [adjustmentTarget, setAdjustmentTarget] = useState<AdjustmentTarget>(null);
  const [paidTarget, setPaidTarget] = useState<PaidTarget>(null);

  useEffect(() => {
    setMonth((m) => m ?? currentMonthKey());
  }, []);

  const fetchRows = useCallback(async () => {
    if (!month) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ month });
      if (departmentId !== "all") params.set("departmentId", departmentId);
      const res = await fetch(`/api/salary?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.rows);
      setDaysInMonth(data.daysInMonth);
      setDivisorMode(data.settings.salaryDivisorDays != null ? "fixed" : "calendar");
      if (data.settings.salaryDivisorDays != null) setDivisorValue(String(data.settings.salaryDivisorDays));
    } catch {
      toast.error(t("salary.loadError"));
    } finally {
      setLoading(false);
    }
  }, [month, departmentId, t]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const totals = useMemo(() => {
    if (!rows) return null;
    return rows.reduce(
      (acc, r) => ({
        salary: acc.salary + (r.monthlySalary ?? 0),
        deduction: acc.deduction + r.attendanceDeduction,
        adjustments: acc.adjustments + r.adjustmentsTotal,
        net: acc.net + (r.netSalary ?? 0),
      }),
      { salary: 0, deduction: 0, adjustments: 0, net: 0 }
    );
  }, [rows]);

  async function saveDivisorSetting() {
    setSavingSettings(true);
    try {
      const salaryDivisorDays = divisorMode === "calendar" ? null : Math.max(1, Math.min(31, Number(divisorValue) || 26));
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salaryDivisorDays }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("salary.settingsSuccess"));
      fetchRows();
    } catch {
      toast.error(t("salary.settingsError"));
    } finally {
      setSavingSettings(false);
    }
  }

  const exportUrl = useMemo(() => {
    if (!month) return "";
    const params = new URLSearchParams({ month });
    if (departmentId !== "all") params.set("departmentId", departmentId);
    return `/api/salary/export?${params.toString()}`;
  }, [month, departmentId]);

  const isCurrentMonth = month != null && month === currentMonthKey();

  function openSalaryDialog(row: SalaryRow) {
    setSalaryTarget({ workerId: row.workerId, name: row.name, monthlySalary: row.monthlySalary });
  }

  function openAdjustmentDialog(row: SalaryRow) {
    setAdjustmentTarget({
      workerId: row.workerId,
      name: row.name,
      month: month ?? currentMonthKey(),
      adjustments: row.adjustments,
    });
  }

  function openPaidDialog(row: SalaryRow) {
    setPaidTarget({
      workerId: row.workerId,
      name: row.name,
      month: month ?? currentMonthKey(),
      netSalary: row.netSalary,
      payment:
        row.isPaid && row.paymentId
          ? { id: row.paymentId, amount: row.paidAmount ?? 0, note: row.paymentNote, paidAt: row.paidAt ?? "" }
          : null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">{t("salary.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {month ? formatMonthLabel(month) : t("common.loading")}
            {month && (
              <>
                {" "}
                &middot; {t("salary.daysUsedForCalc", { n: daysInMonth ?? "…" })}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => (m ? addMonthsToKey(m, -1) : m))}
            disabled={!month}
            aria-label={t("salary.previousMonth")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => (m ? addMonthsToKey(m, 1) : m))}
            disabled={!month || isCurrentMonth}
            aria-label={t("salary.nextMonth")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button asChild disabled={!month} className="bg-gradient-brand text-white shadow-glow hover:opacity-95">
            <a href={exportUrl} download>
              <Download className="h-4 w-4" />
              {t("salary.exportCsv")}
            </a>
          </Button>
        </div>
      </div>

      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <Settings2 className="h-4 w-4" />
            {t("salary.calcSettingsTitle")}
          </CardTitle>
          <CardDescription>
            {t("salary.calcSettingsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2">
            <Label>{t("salary.daysPerMonth")}</Label>
            <Select value={divisorMode} onValueChange={(v) => setDivisorMode(v as "calendar" | "fixed")}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calendar">{t("salary.calendarDaysOption")}</SelectItem>
                <SelectItem value="fixed">{t("salary.fixedDaysOption")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {divisorMode === "fixed" && (
            <div className="space-y-2">
              <Label htmlFor="divisor-days">{t("salary.daysLabel")}</Label>
              <Input
                id="divisor-days"
                type="number"
                min="1"
                max="31"
                className="w-24"
                value={divisorValue}
                onChange={(e) => setDivisorValue(e.target.value)}
              />
            </div>
          )}
          <Button variant="outline" onClick={saveDivisorSetting} disabled={savingSettings}>
            {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder={t("salary.deptFilterPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("salary.allDepartments")}</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setGrantOpen(true)} className="w-fit" disabled={!month}>
          <CalendarPlus className="h-3.5 w-3.5" />
          {t("salary.grantPaidLeave")}
        </Button>
      </div>

      {totals && rows && rows.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("salary.totalSalary"), value: totals.salary },
            { label: t("salary.deductions"), value: -totals.deduction },
            { label: t("salary.adjustments"), value: totals.adjustments },
            { label: t("salary.netPayable"), value: totals.net },
          ].map((chip) => (
            <Card key={chip.label} className="border-border/70 py-0">
              <CardContent className="flex items-center gap-3 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-heading text-lg font-bold leading-tight tabular-nums">
                    {chip.value < 0 ? "-" : ""}
                    {money(Math.abs(chip.value))}
                  </p>
                  <p className="text-xs text-muted-foreground">{chip.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-border/70 py-0">
        <CardHeader className="pt-5">
          <CardTitle className="font-heading">{t("salary.workerPayrollTitle")}</CardTitle>
          <CardDescription>{t("salary.workerPayrollDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !rows ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("salary.noWorkersFound")}</p>
            </div>
          ) : (
            <>
              {/* Phone layout: one tappable card per worker — the 9-column table
                  below is unusable below sm, and unlike the Reports summary
                  table this data isn't just decorative, several cells are the
                  only way to open the Set Salary / Adjust / Mark Paid dialogs,
                  so those actions need to stay reachable rather than hidden. */}
              <div className="divide-y divide-border/60 sm:hidden">
                {rows.map((row) => (
                  <div key={row.workerId} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-tight">
                          {row.name}
                          {!row.isActive && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{t("salary.inactiveTag")}</span>
                          )}
                        </p>
                        <div className="mt-1.5">
                          <DepartmentBadge name={row.department.name} color={row.department.color} />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        title={t("salary.addAdjustmentBtn")}
                        onClick={() => openAdjustmentDialog(row)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("salary.colNetPay")}</p>
                        <p className="font-heading text-xl font-bold leading-tight tabular-nums">
                          {row.netSalary != null ? money(row.netSalary) : "—"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
                          row.isPaid
                            ? "bg-[#0ca30c1a] text-[#0ca30c]"
                            : "border border-dashed border-border text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => openPaidDialog(row)}
                      >
                        {row.isPaid ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {money(row.paidAmount ?? 0)}
                          </>
                        ) : (
                          t("salary.markPaid")
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-border/60 px-2.5 py-1.5 text-left"
                        onClick={() => openSalaryDialog(row)}
                      >
                        <span className="block text-[11px] text-muted-foreground">{t("salary.colMonthlySalary")}</span>
                        <span className="text-sm tabular-nums underline decoration-dotted underline-offset-4">
                          {row.monthlySalary != null ? money(row.monthlySalary) : t("salary.setSalary")}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border/60 px-2.5 py-1.5 text-left"
                        onClick={() => openAdjustmentDialog(row)}
                      >
                        <span className="block text-[11px] text-muted-foreground">{t("salary.colAdjustments")}</span>
                        <span
                          className={`text-sm tabular-nums underline decoration-dotted underline-offset-4 ${
                            row.adjustmentsTotal > 0
                              ? "text-[#0ca30c]"
                              : row.adjustmentsTotal < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {row.adjustmentsTotal !== 0
                            ? `${row.adjustmentsTotal > 0 ? "+" : ""}${money(row.adjustmentsTotal)}`
                            : t("salary.addAdjustment")}
                        </span>
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {t("salary.colPAHLHol")}: {row.present}/{row.absent}/{row.halfDay}/{row.leave}
                      {row.excessLeaveDays > 0 && (
                        <span className="text-destructive"> {t("salary.excessOver", { n: row.excessLeaveDays })}</span>
                      )}
                      /{row.holiday}
                      {row.attendanceDeduction > 0 && (
                        <>
                          {" "}
                          &middot; <span className="text-destructive">-{money(row.attendanceDeduction)}</span>
                        </>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tablet/desktop layout: the full dense table. */}
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t("salary.colWorker")}</TableHead>
                      <TableHead>{t("salary.colDepartment")}</TableHead>
                      <TableHead className="text-right">{t("salary.colMonthlySalary")}</TableHead>
                      <TableHead className="text-right">{t("salary.colPAHLHol")}</TableHead>
                      <TableHead className="text-right">{t("salary.colDeduction")}</TableHead>
                      <TableHead className="text-right">{t("salary.colAdjustments")}</TableHead>
                      <TableHead className="text-right">{t("salary.colNetPay")}</TableHead>
                      <TableHead className="text-right">{t("salary.colPaid")}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.workerId}>
                        <TableCell className="font-medium">
                          {row.name}
                          {!row.isActive && <span className="ml-2 text-xs text-muted-foreground">{t("salary.inactiveTag")}</span>}
                        </TableCell>
                        <TableCell>
                          <DepartmentBadge name={row.department.name} color={row.department.color} />
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            className="tabular-nums underline decoration-dotted underline-offset-4 hover:text-primary"
                            onClick={() => openSalaryDialog(row)}
                          >
                            {row.monthlySalary != null ? money(row.monthlySalary) : t("salary.setSalary")}
                          </button>
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                          {row.present}/{row.absent}/{row.halfDay}/{row.leave}
                          {row.excessLeaveDays > 0 && (
                            <span className="text-destructive"> {t("salary.excessOver", { n: row.excessLeaveDays })}</span>
                          )}
                          /{row.holiday}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-destructive">
                          {row.attendanceDeduction > 0 ? `-${money(row.attendanceDeduction)}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            className={`tabular-nums underline decoration-dotted underline-offset-4 hover:text-primary ${
                              row.adjustmentsTotal > 0
                                ? "text-[#0ca30c]"
                                : row.adjustmentsTotal < 0
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            }`}
                            onClick={() => openAdjustmentDialog(row)}
                          >
                            {row.adjustmentsTotal !== 0 ? `${row.adjustmentsTotal > 0 ? "+" : ""}${money(row.adjustmentsTotal)}` : t("salary.addAdjustment")}
                          </button>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {row.netSalary != null ? money(row.netSalary) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.isPaid
                                ? "bg-[#0ca30c1a] text-[#0ca30c]"
                                : "border border-dashed border-border text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() => openPaidDialog(row)}
                          >
                            {row.isPaid ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                {money(row.paidAmount ?? 0)}
                              </>
                            ) : (
                              t("salary.markPaid")
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title={t("salary.addAdjustmentBtn")}
                            onClick={() => openAdjustmentDialog(row)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SetSalaryDialog
        target={salaryTarget}
        onOpenChange={(open) => !open && setSalaryTarget(null)}
        onSaved={() => {
          fetchRows();
        }}
      />
      <SalaryAdjustmentDialog
        target={adjustmentTarget}
        onOpenChange={(open) => !open && setAdjustmentTarget(null)}
        onChanged={() => {
          fetchRows();
        }}
      />
      <MarkPaidDialog
        target={paidTarget}
        onOpenChange={(open) => !open && setPaidTarget(null)}
        onChanged={() => {
          fetchRows();
        }}
      />
      {month && (
        <PaidLeaveGrantDialog
          open={grantOpen}
          onOpenChange={setGrantOpen}
          month={month}
          onSuccess={() => {
            fetchRows();
          }}
        />
      )}
    </div>
  );
}
