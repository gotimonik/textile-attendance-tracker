"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WorkerRow } from "@/components/workers/workers-view";
import { useTranslation } from "@/lib/i18n/use-translation";

export function DeleteWorkerDialog({
  worker,
  onOpenChange,
}: {
  worker: WorkerRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!worker) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${worker.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("workers.deleteSuccess"));
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(t("workers.deleteError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={worker !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("workers.deleteTitle", { name: worker?.name ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("workers.deleteDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
