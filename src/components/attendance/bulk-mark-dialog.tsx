"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_COLORS } from "@/lib/colors";
import {
  dateKeyToLocalDate,
  localDateToDateKey,
  dateKeysInRange,
  formatDisplayDate,
  todayKey,
} from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type Status = keyof typeof STATUS_COLORS;
type BulkWorker = { id: string; name: string };
type BulkDepartment = { id: string; name: string; color: string; workers: BulkWorker[] };

export function BulkMarkDialog({
  open,
  onOpenChange,
  departments,
  defaultFrom,
  defaultTo,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: BulkDepartment[];
  defaultFrom: string;
  defaultTo: string;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [range, setRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: dateKeyToLocalDate(defaultFrom),
    to: dateKeyToLocalDate(defaultTo),
  });
  const [status, setStatus] = useState<Status>("PRESENT");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRange({ from: dateKeyToLocalDate(defaultFrom), to: dateKeyToLocalDate(defaultTo) });
      setSelected(new Set());
      setStatus("PRESENT");
    }
  }, [open, defaultFrom, defaultTo]);

  const allWorkerIds = useMemo(() => departments.flatMap((d) => d.workers.map((w) => w.id)), [departments]);
  const allSelected = allWorkerIds.length > 0 && allWorkerIds.every((id) => selected.has(id));

  function toggleWorker(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDepartment(dept: BulkDepartment) {
    const deptIds = dept.workers.map((w) => w.id);
    const allDeptSelected = deptIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of deptIds) {
        if (allDeptSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allWorkerIds));
  }

  const dateCount = range.from && range.to ? dateKeysInRange(localDateToDateKey(range.from), localDateToDateKey(range.to)).length : 0;

  async function handleSubmit() {
    if (!range.from || !range.to) {
      toast.error(t("attendance.errPickRange"));
      return;
    }
    if (selected.size === 0) {
      toast.error(t("attendance.errSelectWorker"));
      return;
    }
    const dates = dateKeysInRange(localDateToDateKey(range.from), localDateToDateKey(range.to));
    if (dates.length > 62) {
      toast.error(t("attendance.errRangeTooLarge"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, workerIds: [...selected], status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        return;
      }
      toast.success(t("attendance.bulkSuccessToast", { status: t(`status.${status}`), n: selected.size, days: dates.length }));
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("attendance.bulkDialogTitle")}</DialogTitle>
          <DialogDescription>{t("attendance.bulkDialogDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("attendance.dateRange")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate text-xs">
                      {range.from && range.to
                        ? `${formatDisplayDate(localDateToDateKey(range.from)).split(",")[0]} – ${formatDisplayDate(localDateToDateKey(range.to)).split(",")[0]}`
                        : t("attendance.pickDates")}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={(r) => setRange({ from: r?.from, to: r?.to ?? r?.from })}
                    disabled={{ after: dateKeyToLocalDate(todayKey()) }}
                  />
                </PopoverContent>
              </Popover>
              {dateCount > 0 && <p className="text-xs text-muted-foreground">{t("attendance.daySelected", { n: dateCount })}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("attendance.status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"] as Status[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("attendance.workersLabel")}</Label>
              <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={toggleAll}>
                {allSelected ? t("common.clearAll") : t("common.selectAll")}
              </button>
            </div>
            <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border/70 p-3">
              {departments.map((dept) => {
                const deptIds = dept.workers.map((w) => w.id);
                const deptSelected = deptIds.length > 0 && deptIds.every((id) => selected.has(id));
                return (
                  <div key={dept.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={deptSelected} onCheckedChange={() => toggleDepartment(dept)} id={`dept-${dept.id}`} />
                      <label htmlFor={`dept-${dept.id}`} className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dept.color }} />
                        {dept.name}
                      </label>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-x-3 gap-y-1">
                      {dept.workers.map((w) => (
                        <div key={w.id} className="flex items-center gap-2">
                          <Checkbox checked={selected.has(w.id)} onCheckedChange={() => toggleWorker(w.id)} id={`w-${w.id}`} />
                          <label htmlFor={`w-${w.id}`} className="truncate text-sm">
                            {w.name}
                          </label>
                        </div>
                      ))}
                      {dept.workers.length === 0 && <p className="text-xs text-muted-foreground">{t("common.noWorkers")}</p>}
                    </div>
                  </div>
                );
              })}
              {departments.length === 0 && <p className="text-sm text-muted-foreground">{t("attendance.noDepartmentsYet")}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{t("attendance.selectedWorkersCount", { n: selected.size })}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving} className="bg-gradient-brand text-white">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("attendance.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
