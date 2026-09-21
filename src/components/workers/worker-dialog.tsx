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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkerRow, DepartmentOption } from "@/components/workers/workers-view";
import { IndianRupee } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";

type DialogState = { mode: "create" } | { mode: "edit"; worker: WorkerRow } | null;

const emptyForm = {
  name: "",
  departmentId: "",
  designation: "",
  phone: "",
  joiningDate: "",
  monthlySalary: "",
};

export function WorkerDialog({
  state,
  departments,
  onOpenChange,
}: {
  state: DialogState;
  departments: DepartmentOption[];
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (state?.mode === "edit") {
      const w = state.worker;
      setForm({
        name: w.name,
        departmentId: w.department.id,
        designation: w.designation ?? "",
        phone: w.phone ?? "",
        joiningDate: w.joiningDate.slice(0, 10),
        monthlySalary: w.monthlySalary != null ? String(w.monthlySalary) : "",
      });
    } else if (state?.mode === "create") {
      setForm({ ...emptyForm, departmentId: departments[0]?.id ?? "" });
    }
  }, [state, departments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state) return;
    setLoading(true);

    try {
      const isEdit = state.mode === "edit";
      const res = await fetch(isEdit ? `/api/workers/${state.worker.id}` : "/api/workers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          departmentId: form.departmentId,
          designation: form.designation.trim() || null,
          phone: form.phone.trim() || null,
          joiningDate: form.joiningDate || undefined,
          monthlySalary: form.monthlySalary.trim() === "" ? null : Number(form.monthlySalary),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("common.genericError"));
        setLoading(false);
        return;
      }

      toast.success(isEdit ? t("workers.updateSuccess") : t("workers.addSuccess"));
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {state?.mode === "edit" ? t("workers.dialogEditTitle") : t("workers.dialogAddTitle")}
            </DialogTitle>
            <DialogDescription>
              {state?.mode === "edit" ? t("workers.dialogEditDesc") : t("workers.dialogAddDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="worker-name">{t("workers.fullName")}</Label>
              <Input
                id="worker-name"
                placeholder={t("workers.fullNamePlaceholder")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-department">{t("workers.department")}</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
              >
                <SelectTrigger id="worker-department" className="w-full">
                  <SelectValue placeholder={t("workers.selectDepartment")} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        {d.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="worker-designation">{t("workers.designation")}</Label>
                <Input
                  id="worker-designation"
                  placeholder={t("workers.designationPlaceholder")}
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker-phone">{t("workers.phone")}</Label>
                <Input
                  id="worker-phone"
                  placeholder={t("workers.phonePlaceholder")}
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {state?.mode === "edit" ? t("workers.pinHintEdit") : t("workers.pinHintCreate")}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="worker-joining">{t("workers.joiningDate")}</Label>
                <Input
                  id="worker-joining"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker-salary">{t("workers.monthlySalary")}</Label>
                <div className="relative">
                  <IndianRupee className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="worker-salary"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t("workers.monthlySalaryPlaceholder")}
                    className="pl-8"
                    value={form.monthlySalary}
                    onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.departmentId}
              className="bg-gradient-brand text-white"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {state?.mode === "edit" ? t("workers.saveChanges") : t("workers.addWorker")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
