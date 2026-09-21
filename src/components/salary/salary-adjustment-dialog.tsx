"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, IndianRupee } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMonthLabel } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

export type Adjustment = { id: string; amount: number; reason: string | null; createdAt: string };

export type AdjustmentTarget = { workerId: string; name: string; month: string; adjustments: Adjustment[] } | null;

export function SalaryAdjustmentDialog({
  target,
  onOpenChange,
  onChanged,
}: {
  target: AdjustmentTarget;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<"extra" | "cut">("extra");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function resetForm() {
    setKind("extra");
    setAmount("");
    setReason("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const numeric = Number(amount);
    if (!amount || Number.isNaN(numeric) || numeric <= 0) {
      toast.error(t("salary.errAmountPositive"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/salary/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: target.workerId,
          month: target.month,
          amount: kind === "extra" ? numeric : -numeric,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        return;
      }
      toast.success(kind === "extra" ? t("salary.adjustmentSuccessExtra") : t("salary.adjustmentSuccessCut"));
      resetForm();
      onChanged();
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/salary/adjustments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("salary.adjustmentRemoved"));
      onChanged();
    } catch {
      toast.error(t("salary.adjustmentRemoveError"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{t("salary.adjustmentDialogTitle")}</DialogTitle>
          <DialogDescription>
            {target?.name} — {target ? formatMonthLabel(target.month) : ""}
          </DialogDescription>
        </DialogHeader>

        {target && target.adjustments.length > 0 && (
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border/70 p-2">
            {target.adjustments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className={`text-sm font-medium tabular-nums ${a.amount >= 0 ? "text-[#0ca30c]" : "text-destructive"}`}>
                    {a.amount >= 0 ? "+" : ""}
                    {a.amount}
                  </p>
                  {a.reason && <p className="truncate text-xs text-muted-foreground">{a.reason}</p>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === a.id}
                  onClick={() => handleDelete(a.id)}
                >
                  {deletingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("salary.typeLabel")}</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "extra" | "cut")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="extra">{t("salary.extraPay")}</SelectItem>
                  <SelectItem value="cut">{t("salary.cutDeduction")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustment-amount">{t("salary.adjustmentAmountLabel")}</Label>
              <div className="relative">
                <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="adjustment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjustment-reason">{t("salary.reasonLabel")}</Label>
            <Input
              id="adjustment-reason"
              placeholder={t("salary.reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("salary.close")}
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-brand text-white">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("salary.addAdjustmentBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
