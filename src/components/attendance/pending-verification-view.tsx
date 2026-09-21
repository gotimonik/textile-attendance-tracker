"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X, Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentBadge } from "@/components/department-badge";
import { STATUS_COLORS } from "@/lib/colors";
import { formatDisplayDate } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type Status = keyof typeof STATUS_COLORS;
type PendingRow = {
  id: string;
  date: string;
  status: Status;
  markedAt: string;
  workerId: string;
  workerName: string;
  department: { id: string; name: string; color: string };
};

export function PendingVerificationView({ onChanged }: { onChanged?: () => void }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PendingRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/pending");
      const data = await res.json();
      setRows(data.rows ?? []);
      setSelected(new Set());
    } catch {
      toast.error(t("attendance.pendingLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = rows != null && rows.length > 0 && rows.every((r) => selected.has(r.id));
  function toggleAll() {
    if (!rows) return;
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function decide(ids: string[], decision: "APPROVED" | "REJECTED") {
    if (ids.length === 0) return;
    setActing(true);
    try {
      const res = await fetch("/api/attendance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, decision }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        decision === "APPROVED"
          ? t("attendance.approvedToast", { n: ids.length })
          : t("attendance.rejectedToast", { n: ids.length })
      );
      await fetchRows();
      onChanged?.();
    } catch {
      toast.error(t("attendance.verifyUpdateError"));
    } finally {
      setActing(false);
    }
  }

  if (loading || !rows) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("attendance.pendingEmpty")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="select-all-pending" />
          <span>
            {selected.size > 0
              ? t("attendance.selectedCount", { n: selected.size })
              : t("attendance.awaitingReview", { n: rows.length })}
          </span>
        </label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selected.size === 0 || acting}
            onClick={() => decide([...selected], "REJECTED")}
          >
            <X className="h-3.5 w-3.5" />
            {t("attendance.reject")}
          </Button>
          <Button
            size="sm"
            disabled={selected.size === 0 || acting}
            onClick={() => decide([...selected], "APPROVED")}
            className="bg-gradient-brand text-white"
          >
            {acting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {t("attendance.approve")}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id} className="border-border/70 py-0">
            <CardContent className="flex items-center gap-3 p-3.5">
              <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium leading-tight">{r.workerName}</p>
                  <DepartmentBadge name={r.department.name} color={r.department.color} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{formatDisplayDate(r.date)}</p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${STATUS_COLORS[r.status]}1a`, color: STATUS_COLORS[r.status] }}
              >
                {t(`status.${r.status}`)}
              </span>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title={t("attendance.reject")}
                  disabled={acting}
                  onClick={() => decide([r.id], "REJECTED")}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-[#0ca30c] hover:text-[#0ca30c]"
                  title={t("attendance.approve")}
                  disabled={acting}
                  onClick={() => decide([r.id], "APPROVED")}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
