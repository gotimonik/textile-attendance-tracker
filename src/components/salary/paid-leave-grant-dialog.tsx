"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMonthLabel } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type GrantWorker = { id: string; name: string };
type GrantDepartment = { id: string; name: string; color: string; workers: GrantWorker[] };

export function PaidLeaveGrantDialog({
  open,
  onOpenChange,
  month,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<GrantDepartment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState("2");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setQuota("2");
    setLoading(true);
    fetch(`/api/salary?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        const rows: { workerId: string; name: string; department: { id: string; name: string; color: string } }[] =
          data.rows ?? [];
        const byDept = new Map<string, GrantDepartment>();
        for (const r of rows) {
          if (!byDept.has(r.department.id)) {
            byDept.set(r.department.id, { id: r.department.id, name: r.department.name, color: r.department.color, workers: [] });
          }
          byDept.get(r.department.id)!.workers.push({ id: r.workerId, name: r.name });
        }
        setDepartments([...byDept.values()]);
      })
      .catch(() => toast.error(t("salary.loadWorkersError")))
      .finally(() => setLoading(false));
  }, [open, month, t]);

  const allWorkerIds = useMemo(() => (departments ?? []).flatMap((d) => d.workers.map((w) => w.id)), [departments]);
  const allSelected = allWorkerIds.length > 0 && allWorkerIds.every((id) => selected.has(id));

  function toggleWorker(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleDepartment(dept: GrantDepartment) {
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

  async function handleSubmit() {
    if (selected.size === 0) {
      toast.error(t("salary.errSelectWorker"));
      return;
    }
    const quotaNum = Number(quota);
    if (Number.isNaN(quotaNum) || quotaNum < 0) {
      toast.error(t("salary.errQuota"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/salary/leave-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, workerIds: [...selected], quota: quotaNum }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        return;
      }
      toast.success(
        t("salary.grantSuccess", { n: quotaNum, m: selected.size, month: formatMonthLabel(month) })
      );
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
          <DialogTitle className="font-heading">{t("salary.grantDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("salary.grantDialogDesc", { month: formatMonthLabel(month) })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grant-quota">{t("salary.quotaLabel")}</Label>
            <Input
              id="grant-quota"
              type="number"
              min="0"
              max="31"
              className="w-28"
              value={quota}
              onChange={(e) => setQuota(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("salary.workersLabel")}</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={toggleAll}
                disabled={loading}
              >
                {allSelected ? t("common.clearAll") : t("common.selectAll")}
              </button>
            </div>
            <div className="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-border/70 p-3">
              {loading || !departments ? (
                <p className="text-sm text-muted-foreground">{t("salary.loadingWorkers")}</p>
              ) : departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("salary.noWorkersFoundGrant")}</p>
              ) : (
                departments.map((dept) => {
                  const deptIds = dept.workers.map((w) => w.id);
                  const deptSelected = deptIds.length > 0 && deptIds.every((id) => selected.has(id));
                  return (
                    <div key={dept.id} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={deptSelected} onCheckedChange={() => toggleDepartment(dept)} id={`ldept-${dept.id}`} />
                        <label htmlFor={`ldept-${dept.id}`} className="flex items-center gap-1.5 text-xs font-semibold">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dept.color }} />
                          {dept.name}
                        </label>
                      </div>
                      <div className="ml-6 grid grid-cols-2 gap-x-3 gap-y-1">
                        {dept.workers.map((w) => (
                          <div key={w.id} className="flex items-center gap-2">
                            <Checkbox checked={selected.has(w.id)} onCheckedChange={() => toggleWorker(w.id)} id={`lw-${w.id}`} />
                            <label htmlFor={`lw-${w.id}`} className="truncate text-sm">
                              {w.name}
                            </label>
                          </div>
                        ))}
                        {dept.workers.length === 0 && <p className="text-xs text-muted-foreground">{t("common.noWorkers")}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("salary.grantSelectedCount", { n: selected.size })}</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving || loading} className="bg-gradient-brand text-white">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("salary.grant")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
