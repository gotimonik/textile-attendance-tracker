"use client";

import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_COLORS } from "@/lib/colors";
import { dateKeysInRange, formatDisplayDate, todayKey, weekdayShortOf } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type Status = keyof typeof STATUS_COLORS;
type CellRecord = { status: Status; pending: boolean };
type ApiWorker = { id: string; name: string; records: Record<string, CellRecord> };
type ApiDepartment = { id: string; name: string; color: string; workers: ApiWorker[] };

const STATUS_SHORT: Record<Status, string> = {
  PRESENT: "P",
  ABSENT: "A",
  HALF_DAY: "H",
  LEAVE: "L",
  HOLIDAY: "•",
};

const LEGEND_STATUSES: Status[] = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"];

// This component only ever mounts after the viewer switches to the Week/Month
// tab (a client-side interaction — the tab starts on "day" and is never
// active during the server render), so reading todayKey() directly here
// carries no hydration risk, unlike a value computed during the initial render.
export function AttendanceRangeView({
  from,
  to,
  departmentId,
  onSelectDate,
  refreshKey,
}: {
  from: string;
  to: string;
  departmentId?: string;
  onSelectDate: (dateKey: string) => void;
  refreshKey?: number;
}) {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<ApiDepartment[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (departmentId) params.set("departmentId", departmentId);
    fetch(`/api/attendance/range?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDepartments(data.departments);
      })
      .catch(() => {
        if (!cancelled) toast.error(t("attendance.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, departmentId, refreshKey, t]);

  const dateKeys = dateKeysInRange(from, to);
  const today = todayKey();

  if (loading || !departments) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const activeDepartments = departments.filter((d) => d.workers.length > 0);

  if (activeDepartments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          {t("attendance.noActiveWorkersToShow")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/70 py-0">
      <div className="relative">
        {/* Right-edge fade — a static hint that there's more to scroll to.
            The grid is always wider than a phone screen (a week is already
            tight, a month far more so), and overflow-x-auto alone gives no
            visual cue on touch devices until the user happens to swipe. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-l from-card to-transparent sm:hidden" />
        <CardContent className="overflow-x-auto p-0">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="sticky left-0 z-10 w-24 min-w-24 max-w-24 truncate bg-muted/30 px-2 py-2 text-left align-bottom font-medium sm:w-40 sm:min-w-40 sm:max-w-40 sm:px-3">
                {t("attendance.workerCol")}
              </th>
              {dateKeys.map((key) => {
                const isToday = key === today;
                return (
                  <th key={key} className={isToday ? "bg-primary/10 px-0" : "px-0"}>
                    <button
                      type="button"
                      onClick={() => onSelectDate(key)}
                      className={`mx-auto flex h-12 w-9 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors hover:text-foreground ${
                        isToday ? "text-primary" : "text-muted-foreground"
                      }`}
                      title={formatDisplayDate(key)}
                    >
                      <span className="uppercase leading-none">{weekdayShortOf(key)}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold leading-none ${
                          isToday ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        {Number(key.slice(8, 10))}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeDepartments.map((dept) => (
              <Fragment key={dept.id}>
                <tr className="border-b border-border/40 bg-muted/20">
                  <td colSpan={dateKeys.length + 1} className="sticky left-0 bg-muted/20 px-2 py-1.5 sm:px-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dept.color }} />
                      <span className="text-xs font-semibold">{dept.name}</span>
                      <span className="text-xs text-muted-foreground">&middot; {t("attendance.workerCountShort", { n: dept.workers.length })}</span>
                    </span>
                  </td>
                </tr>
                {dept.workers.map((w) => (
                  <tr key={w.id} className="border-b border-border/40 last:border-0 hover:bg-muted/10">
                    <td className="sticky left-0 z-10 w-24 min-w-24 max-w-24 truncate bg-background px-2 py-1.5 sm:w-40 sm:min-w-40 sm:max-w-40 sm:px-3">
                      <p className="truncate text-sm font-medium leading-tight">{w.name}</p>
                    </td>
                    {dateKeys.map((key) => {
                      const cell = w.records[key];
                      const status = cell?.status;
                      const isPending = cell?.pending === true;
                      const isToday = key === today;
                      return (
                        <td key={key} className={isToday ? "bg-primary/5 p-0.5 text-center" : "p-0.5 text-center"}>
                          {status ? (
                            <span
                              title={
                                isPending
                                  ? `${formatDisplayDate(key)} — ${t(`status.${status}`)} (${t("attendance.pendingVerificationBadge")})`
                                  : `${formatDisplayDate(key)} — ${t(`status.${status}`)}`
                              }
                              className={`relative mx-auto flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold text-white ${
                                isPending ? "opacity-50 ring-2 ring-amber-500 ring-offset-1" : ""
                              }`}
                              style={{ backgroundColor: STATUS_COLORS[status] }}
                            >
                              {STATUS_SHORT[status]}
                              {isPending && (
                                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-amber-500" />
                              )}
                            </span>
                          ) : (
                            <span
                              title={formatDisplayDate(key)}
                              className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-muted/50 text-[10px] text-muted-foreground/40"
                            >
                              &middot;
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        </CardContent>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 px-3.5 py-2.5 text-xs text-muted-foreground">
        {LEGEND_STATUSES.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
            {t(`status.${s}`)}
          </span>
        ))}
      </div>
    </Card>
  );
}
