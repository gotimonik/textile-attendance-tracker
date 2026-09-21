"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
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
import type { WorkerRow } from "@/components/workers/workers-view";
import { useTranslation } from "@/lib/i18n/use-translation";

export function PinDialog({
  worker,
  onOpenChange,
}: {
  worker: WorkerRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (worker) {
      setPin("");
      setConfirmPin("");
    }
  }, [worker]);

  async function submitPin(newPin: string | null) {
    if (!worker) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        return;
      }
      toast.success(newPin ? t("workers.pinSetSuccess") : t("workers.pinRemoveSuccess"));
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setLoading(false);
      setClearing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) {
      toast.error(t("workers.pinErrLength"));
      return;
    }
    if (pin !== confirmPin) {
      toast.error(t("workers.pinErrMismatch"));
      return;
    }
    submitPin(pin);
  }

  const needsPhone = worker && !worker.phone;

  return (
    <Dialog open={worker !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {worker?.hasPin ? t("workers.pinResetTitle") : t("workers.pinSetTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("workers.pinDialogDesc", { name: worker?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>

          {needsPhone ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t("workers.pinNeedsPhone")}
            </p>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-pin">{t("workers.newPin")}</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="4-6 digits"
                    className="pl-9"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    minLength={4}
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">{t("workers.confirmPin")}</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="4-6 digits"
                    className="pl-9"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    minLength={4}
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {worker?.hasPin && (
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="mr-auto text-destructive hover:text-destructive"
                onClick={() => {
                  setClearing(true);
                  submitPin(null);
                }}
              >
                {clearing && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("workers.removeLogin")}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            {!needsPhone && (
              <Button type="submit" disabled={loading} className="bg-gradient-brand text-white">
                {loading && !clearing && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("workers.savePin")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
