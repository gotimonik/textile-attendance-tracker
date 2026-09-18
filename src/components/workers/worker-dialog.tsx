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

type DialogState = { mode: "create" } | { mode: "edit"; worker: WorkerRow } | null;

const emptyForm = {
  name: "",
  departmentId: "",
  designation: "",
  phone: "",
  joiningDate: "",
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
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      toast.success(isEdit ? "Worker updated" : "Worker added");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
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
              {state?.mode === "edit" ? "Edit worker" : "Add worker"}
            </DialogTitle>
            <DialogDescription>
              {state?.mode === "edit"
                ? "Update this worker's details."
                : "Add a new worker to a department."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="worker-name">Full name</Label>
              <Input
                id="worker-name"
                placeholder="e.g. Ravi Sharma"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="worker-department">Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
              >
                <SelectTrigger id="worker-department" className="w-full">
                  <SelectValue placeholder="Select department" />
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
                <Label htmlFor="worker-designation">Designation</Label>
                <Input
                  id="worker-designation"
                  placeholder="Machine Operator"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="worker-phone">Phone</Label>
                <Input
                  id="worker-phone"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {state?.mode === "edit"
                ? "Use the … menu on this worker to set or reset their login PIN once a phone number is saved."
                : "You can set a login PIN for this worker afterwards from the … menu."}
            </p>

            <div className="space-y-2">
              <Label htmlFor="worker-joining">Joining date</Label>
              <Input
                id="worker-joining"
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm((f) => ({ ...f, joiningDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.departmentId}
              className="bg-gradient-brand text-white"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {state?.mode === "edit" ? "Save changes" : "Add worker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
