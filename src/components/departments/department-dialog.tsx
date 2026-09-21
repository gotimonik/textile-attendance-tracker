"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DepartmentRow } from "@/components/departments/departments-view";
import { useTranslation } from "@/lib/i18n/use-translation";

type DialogState = { mode: "create" } | { mode: "edit"; department: DepartmentRow } | null;

export function DepartmentDialog({
  state,
  onOpenChange,
}: {
  state: DialogState;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state?.mode === "edit") setName(state.department.name);
    else if (state?.mode === "create") setName("");
  }, [state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state) return;
    setLoading(true);

    try {
      const isEdit = state.mode === "edit";
      const res = await fetch(isEdit ? `/api/departments/${state.department.id}` : "/api/departments", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        setLoading(false);
        return;
      }

      toast.success(isEdit ? t("departments.successUpdate") : t("departments.successCreate"));
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={state !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {state?.mode === "edit" ? t("departments.dialogEditTitle") : t("departments.dialogAddTitle")}
            </DialogTitle>
            <DialogDescription>
              {state?.mode === "edit" ? t("departments.dialogEditDesc") : t("departments.dialogAddDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="dept-name">{t("departments.nameLabel")}</Label>
            <Input
              id="dept-name"
              placeholder={t("departments.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-brand text-white">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {state?.mode === "edit" ? t("departments.saveChanges") : t("departments.createBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
