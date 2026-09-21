"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_COLORS } from "@/lib/colors";
import { addMonthsToKey, currentMonthKey, formatMonthLabel, todayKey } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type Status = keyof typeof STATUS_COLORS;
type CellRecord = { status: Status; verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | null };

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const LEGEND_STATUSES: Status[] = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"];

// Pure function of the given monthKey (not of "now"), so it's safe to call
// during the server render too — unlike currentMonthKey()/todayKey() below,
// which read the viewer's local clock and are only ever used after mount.
function monthGridCells(monthKey: string): (string | null)[] {
  const [y, m] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${monthKey}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function WorkerCalendar() {
  const { t } = useTranslation();
  // Starts null and is set client-side only (never during the server render) —
  // currentMonthKey() reads the viewer's local timezone, which can differ from
  // the server's, so computing it during SSR would cause a hydration mismatch.
  const [month, setMonth] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, CellRecord> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMonth((m) => m ?? currentMonthKey());
  }, []);

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/worker/attendance?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setRecords(data.records ?? {});
      })
      .catch(() => {
        if (!cancelled) toast.error(t("worker.calendarLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, t]);

  const isCurrentMonth = month != null && month === currentMonthKey();
  const cells = month ? monthGridCells(month) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-heading text-base font-bold">{month ? formatMonthLabel(month) : t("common.loading")}</p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!month}
            onClick={() => setMonth((m) => (m ? addMonthsToKey(m, -1) : m))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!month || isCurrentMonth}
            onClick={() => setMonth((m) => (m ? addMonthsToKey(m, 1) : m))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading || !records || !month ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <Card className="border-border/70">
          <CardContent className="p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
              {WEEKDAYS.map((w, i) => (
                <div key={i} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((key, i) => {
                if (!key) return <div key={`blank-${i}`} />;
                const cell = records[key];
                const status = cell?.status;
                const isPending = cell?.verificationStatus === "PENDING";
                const isToday = key === todayKey();
                const dayNum = Number(key.slice(8, 10));
                return (
                  <div
                    key={key}
                    title={
                      status
                        ? isPending
                          ? `${key} — ${t(`status.${status}`)} (${t("worker.awaitingVerificationLegend")})`
                          : `${key} — ${t(`status.${status}`)}`
                        : key
                    }
                    className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs ${
                      isToday ? "ring-2 ring-primary" : ""
                    } ${isPending ? "opacity-60 outline-dashed outline-1 outline-amber-500" : ""}`}
                    style={status ? { backgroundColor: `${STATUS_COLORS[status]}1a` } : undefined}
                  >
                    <span className={`font-medium ${isToday ? "text-primary" : ""}`}>{dayNum}</span>
                    {status && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />}
                    {isPending && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && records && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          {LEGEND_STATUSES.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
              {t(`status.${s}`)}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            {t("worker.awaitingVerificationLegend")}
          </span>
        </div>
      )}
    </div>
  );
}
