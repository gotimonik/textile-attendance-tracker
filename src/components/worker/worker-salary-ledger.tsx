"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonthLabel } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type LedgerMonth = {
  month: string;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  paidLeaveQuota: number;
  excessLeaveDays: number;
  deductionDays: number;
  attendanceDeduction: number;
  adjustmentsTotal: number;
  estimatedNetSalary: number | null;
  isPaid: boolean;
  paidAmount: number | null;
  paidAt: string | null;
  paymentNote: string | null;
};

type LedgerResponse = { monthlySalary: number | null; months: LedgerMonth[] };

function money(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatPaidDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function WorkerSalaryLedger() {
  const { t } = useTranslation();
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/worker/salary")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("worker.salaryLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading || !data) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (data.monthlySalary == null) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Wallet className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("worker.salaryNoneSet")}</p>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = round2(data.months.filter((m) => m.isPaid).reduce((sum, m) => sum + (m.paidAmount ?? 0), 0));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="border-border/70 py-0">
          <CardContent className="p-3.5">
            <p className="font-heading text-lg font-bold tabular-nums">{money(data.monthlySalary)}</p>
            <p className="text-xs text-muted-foreground">{t("worker.salaryMonthly")}</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-gradient-brand-soft py-0">
          <CardContent className="p-3.5">
            <p className="font-heading text-lg font-bold tabular-nums">{money(totalPaid)}</p>
            <p className="text-xs text-muted-foreground">{t("worker.salaryPaidSinceJoining")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2.5">
        {data.months.map((m) => (
          <Card key={m.month} className="border-border/70 py-0">
            <CardContent className="flex items-center justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{formatMonthLabel(m.month)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.present}P &middot; {m.absent}A &middot; {m.halfDay}H &middot; {m.leave}L
                  {m.excessLeaveDays > 0 && (
                    <span className="text-destructive"> {t("worker.salaryOverQuota", { n: m.excessLeaveDays })}</span>
                  )}
                </p>
                {m.isPaid && m.paidAt ? (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#0ca30c]">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {t("worker.salaryPaidOn", { date: formatPaidDate(m.paidAt) })}
                    {m.paymentNote && ` — ${m.paymentNote}`}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">{t("worker.salaryNotYetPaid")}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-heading text-base font-bold tabular-nums">
                  {money(m.isPaid ? m.paidAmount ?? 0 : m.estimatedNetSalary ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">{m.isPaid ? t("worker.salaryPaid") : t("worker.salaryEstimated")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
