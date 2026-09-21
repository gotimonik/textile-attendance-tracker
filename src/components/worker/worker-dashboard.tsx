"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserCheck, UserX, Clock3, Palmtree, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkerCalendar } from "@/components/worker/worker-calendar";
import { WorkerSalaryLedger } from "@/components/worker/worker-salary-ledger";
import { STATUS_COLORS } from "@/lib/colors";
import { formatDisplayDate, todayKey } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

const HISTORY_DAYS = 60;

type Status = keyof typeof STATUS_COLORS;
type SelfMarkStatus = Exclude<Status, "HOLIDAY">;
type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;
type HistoryEntry = { date: string; status: Status; verificationStatus: VerificationStatus };

const SELF_MARK_OPTIONS: { status: SelfMarkStatus; labelKey: string; icon: typeof UserCheck }[] = [
  { status: "PRESENT", labelKey: "worker.optionPresent", icon: UserCheck },
  { status: "ABSENT", labelKey: "worker.optionAbsent", icon: UserX },
  { status: "HALF_DAY", labelKey: "worker.optionHalfDay", icon: Clock3 },
  { status: "LEAVE", labelKey: "worker.optionLeave", icon: Palmtree },
];

export function WorkerDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"today" | "calendar" | "salary">("today");
  const [today, setToday] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<SelfMarkStatus | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/worker/attendance?days=${HISTORY_DAYS}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToday(data.today);
      setHistory(data.history);
    } catch {
      toast.error(t("worker.loadErrorToast"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleMark(status: SelfMarkStatus) {
    setMarking(status);
    try {
      const res = await fetch("/api/worker/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("worker.markSuccessToast", { status: t(`status.${status}`) }));
      await fetchData();
    } catch {
      toast.error(t("worker.markErrorToast"));
    } finally {
      setMarking(null);
    }
  }

  // Computed client-side only (never during the server render): todayKey() reads
  // the viewer's local timezone, which can differ from the server's, so baking it
  // into the initial render would cause a hydration mismatch.
  const [todayLabel, setTodayLabel] = useState<string | null>(null);
  useEffect(() => setTodayLabel(formatDisplayDate(todayKey())), []);

  const summary = useMemo(() => {
    if (!history) return null;
    return {
      present: history.filter((h) => h.status === "PRESENT").length,
      absent: history.filter((h) => h.status === "ABSENT").length,
      halfDay: history.filter((h) => h.status === "HALF_DAY").length,
      leave: history.filter((h) => h.status === "LEAVE").length,
    };
  }, [history]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">{t("worker.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{todayLabel ?? t("common.loading")}</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="today">{t("worker.tabToday")}</TabsTrigger>
          <TabsTrigger value="calendar">{t("worker.tabCalendar")}</TabsTrigger>
          <TabsTrigger value="salary">{t("worker.tabSalary")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "today" && (
        <>
          <Card className="border-none bg-gradient-brand-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                {t("worker.tabToday")}
                {today?.verificationStatus === "PENDING" && (
                  <Badge className="border-transparent bg-amber-500/15 font-medium text-amber-700 dark:text-amber-500">
                    {t("worker.pendingVerification")}
                  </Badge>
                )}
                {today?.verificationStatus === "REJECTED" && (
                  <Badge className="border-transparent bg-destructive/15 font-medium text-destructive">
                    {t("worker.rejected")}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {loading
                  ? t("common.loading")
                  : today
                    ? today.verificationStatus === "PENDING"
                      ? t("worker.todayMarkedPending", { status: t(`status.${today.status}`) })
                      : today.verificationStatus === "REJECTED"
                        ? t("worker.todayMarkedRejected", { status: t(`status.${today.status}`) })
                        : t("worker.todayMarked", { status: t(`status.${today.status}`) })
                    : t("worker.todayEmpty")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {SELF_MARK_OPTIONS.map((opt) => {
                  const isActive = today?.status === opt.status;
                  const isBusy = marking === opt.status;
                  return (
                    <Button
                      key={opt.status}
                      variant="outline"
                      disabled={loading || marking !== null}
                      onClick={() => handleMark(opt.status)}
                      className="h-auto flex-col gap-1.5 border-border/70 bg-background/70 py-3"
                      style={
                        isActive
                          ? { borderColor: STATUS_COLORS[opt.status], color: STATUS_COLORS[opt.status] }
                          : undefined
                      }
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <opt.icon className="h-4 w-4" style={isActive ? { color: STATUS_COLORS[opt.status] } : undefined} />
                      )}
                      <span className="text-xs font-medium">{t(opt.labelKey)}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {summary && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { status: "PRESENT" as const, value: summary.present, icon: UserCheck, color: STATUS_COLORS.PRESENT },
                { status: "ABSENT" as const, value: summary.absent, icon: UserX, color: STATUS_COLORS.ABSENT },
                { status: "HALF_DAY" as const, value: summary.halfDay, icon: Clock3, color: STATUS_COLORS.HALF_DAY },
                { status: "LEAVE" as const, value: summary.leave, icon: Palmtree, color: STATUS_COLORS.LEAVE },
              ].map((chip) => (
                <Card key={chip.status} className="border-border/70 py-0">
                  <CardContent className="flex items-center gap-2.5 p-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: chip.color }}
                    >
                      <chip.icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-heading text-base font-bold leading-tight tabular-nums">{chip.value}</p>
                      <p className="text-[11px] text-muted-foreground">{t(`status.${chip.status}`)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-heading text-lg font-bold">{t("worker.recentHistory")}</h2>
            <p className="-mt-2 text-xs text-muted-foreground">{t("worker.lastNDays", { n: HISTORY_DAYS })}</p>
            {loading || !history ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  {t("worker.noHistory")}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden border-border/70 py-0">
                <CardContent className="divide-y divide-border/60 p-0">
                  {history.map((entry) => (
                    <div key={entry.date} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm">{formatDisplayDate(entry.date)}</span>
                      <div className="flex items-center gap-1.5">
                        {entry.verificationStatus === "PENDING" && (
                          <Badge className="border-transparent bg-amber-500/15 font-medium text-amber-700 dark:text-amber-500">
                            {t("worker.pendingVerification")}
                          </Badge>
                        )}
                        {entry.verificationStatus === "REJECTED" && (
                          <Badge className="border-transparent bg-destructive/15 font-medium text-destructive">
                            {t("worker.rejected")}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="border-transparent font-medium"
                          style={{
                            backgroundColor: `color-mix(in oklab, ${STATUS_COLORS[entry.status]} 15%, transparent)`,
                            color: STATUS_COLORS[entry.status],
                          }}
                        >
                          {t(`status.${entry.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {tab === "calendar" && <WorkerCalendar />}
      {tab === "salary" && <WorkerSalaryLedger />}
    </div>
  );
}
