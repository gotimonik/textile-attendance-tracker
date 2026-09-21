"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IndianRupee, Loader2 } from "lucide-react";
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
import { useTranslation } from "@/lib/i18n/use-translation";

export type SalaryTarget = { workerId: string; name: string; monthlySalary: number | null } | null;

export function SetSalaryDialog({
  target,
  onOpenChange,
  onSaved,
}: {
  target: SalaryTarget;
  onOpenChange: (open: boolean) => void;
  onSaved: (workerId: string, monthlySalary: number | null) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (target) setValue(target.monthlySalary != null ? String(target.monthlySalary) : "");
  }, [target]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setLoading(true);
    const monthlySalary = value.trim() === "" ? null : Number(value);
    try {
      const res = await fetch(`/api/workers/${target.workerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlySalary }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        return;
      }
      toast.success(t("salary.setSalarySuccess"));
      onSaved(target.workerId, monthlySalary);
      onOpenChange(false);
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">{t("salary.setSalaryDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("salary.setSalaryDialogDesc", { name: target?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="salary-amount">{t("salary.amountLabel")}</Label>
            <div className="relative mt-2">
              <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="salary-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder={t("salary.amountPlaceholder")}
                className="pl-8"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-brand text-white">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
