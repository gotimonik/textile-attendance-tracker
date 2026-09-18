"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserCheck, UserX, Clock3, Palmtree, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/colors";
import { formatDisplayDate, todayKey } from "@/lib/date";

type Status = keyof typeof STATUS_COLORS;
type SelfMarkStatus = Exclude<Status, "HOLIDAY">;
type HistoryEntry = { date: string; status: Status };

const SELF_MARK_OPTIONS: { status: SelfMarkStatus; label: string; icon: typeof UserCheck }[] = [
  { status: "PRESENT", label: "Present", icon: UserCheck },
  { status: "ABSENT", label: "Absent", icon: UserX },
  { status: "HALF_DAY", label: "Half Day", icon: Clock3 },
  { status: "LEAVE", label: "On Leave", icon: Palmtree },
];

export function WorkerDashboard() {
  const [today, setToday] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<SelfMarkStatus | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/worker/attendance?days=30");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setToday(data.today);
      setHistory(data.history);
    } catch {
      toast.error("Could not load your attendance");
    } finally {
      setLoading(false);
    }
  }, []);

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
      toast.success(`Marked yourself ${STATUS_LABELS[status]} for today`);
      await fetchData();
    } catch {
      toast.error("Could not save — please try again");
    } finally {
      setMarking(null);
    }
  }

  const todayLabel = formatDisplayDate(todayKey());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Your attendance</h1>
        <p className="text-sm text-muted-foreground">{todayLabel}</p>
      </div>

      <Card className="border-none bg-gradient-brand-soft">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Today</CardTitle>
          <CardDescription>
            {loading
              ? "Loading…"
              : today
                ? `You're marked ${STATUS_LABELS[today.status]} today. Tap another option to change it.`
                : "You haven't marked today's attendance yet."}
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
                  <span className="text-xs font-medium">{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-bold">Recent history</h2>
        {loading || !history ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No attendance marked yet.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border/70 py-0">
            <CardContent className="divide-y divide-border/60 p-0">
              {history.map((entry) => (
                <div key={entry.date} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{formatDisplayDate(entry.date)}</span>
                  <Badge
                    variant="outline"
                    className="border-transparent font-medium"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${STATUS_COLORS[entry.status]} 15%, transparent)`,
                      color: STATUS_COLORS[entry.status],
                    }}
                  >
                    {STATUS_LABELS[entry.status]}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
