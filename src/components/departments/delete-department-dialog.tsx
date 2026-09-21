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
import type { DepartmentRow } from "@/components/departments/departments-view";
import { useTranslation } from "@/lib/i18n/use-translation";

export function DeleteDepartmentDialog({
  department,
  onOpenChange,
}: {
  department: DepartmentRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!department) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${department.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || t("departments.deleteError"));
        setLoading(false);
        return;
      }

      toast.success(t("departments.deleteSuccess"));
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={department !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("departments.deleteTitle", { name: department?.name ?? "" })}</AlertDialogTitle>
          <AlertDialogDescription>
            {department && department.workerCount > 0
              ? t("departments.deleteDescHasWorkers", { n: department.workerCount })
              : t("departments.deleteDescSafe")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading || (department?.workerCount ?? 0) > 0}
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
