"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IndianRupee, Loader2, CheckCircle2 } from "lucide-react";
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
import { formatMonthLabel } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

export type PaymentInfo = { id: string; amount: number; note: string | null; paidAt: string };

export type PaidTarget = {
  workerId: string;
  name: string;
  month: string;
  netSalary: number | null;
  payment: PaymentInfo | null;
} | null;

function formatPaidDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function MarkPaidDialog({
  target,
  onOpenChange,
  onChanged,
}: {
  target: PaidTarget;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [unmarking, setUnmarking] = useState(false);

  useEffect(() => {
    if (target) {
      setAmount(
        target.payment ? String(target.payment.amount) : target.netSalary != null ? String(target.netSalary) : ""
      );
      setNote(target.payment?.note ?? "");
    }
  }, [target]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    const numeric = Number(amount);
    if (!amount || Number.isNaN(numeric) || numeric < 0) {
      toast.error(t("salary.errAmountValid"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/salary/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: target.workerId,
          month: target.month,
          amount: numeric,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        return;
      }
      toast.success(t("salary.markedPaidSuccess"));
      onChanged();
      onOpenChange(false);
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleUnmark() {
    if (!target?.payment) return;
    setUnmarking(true);
    try {
      const res = await fetch(`/api/salary/payments/${target.payment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("salary.unmarkedPaidSuccess"));
      onChanged();
      onOpenChange(false);
    } catch {
      toast.error(t("salary.markPaidUpdateError"));
    } finally {
      setUnmarking(false);
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">{t("salary.markPaidDialogTitle")}</DialogTitle>
            <DialogDescription>
              {target?.name} — {target ? formatMonthLabel(target.month) : ""}
            </DialogDescription>
          </DialogHeader>

          {target?.payment && (
            <div className="flex items-center gap-2 rounded-lg bg-[#0ca30c1a] px-3 py-2 text-xs font-medium text-[#0ca30c]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {t("salary.alreadyPaidNote", { date: formatPaidDate(target.payment.paidAt) })}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paid-amount">{t("salary.amountPaidLabel")}</Label>
              <div className="relative">
                <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="paid-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {target?.netSalary != null && (
                <p className="text-xs text-muted-foreground">{t("salary.autoCalcNote", { amount: target.netSalary.toLocaleString("en-IN") })}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paid-note">{t("salary.noteLabel")}</Label>
              <Input
                id="paid-note"
                placeholder={t("salary.notePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {target?.payment && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive sm:mr-auto"
                onClick={handleUnmark}
                disabled={unmarking || loading}
              >
                {unmarking && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("salary.unmarkPaid")}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading || unmarking} className="bg-gradient-brand text-white">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {target?.payment ? t("salary.update") : t("salary.markPaidBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
