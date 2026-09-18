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

export function DeleteDepartmentDialog({
  department,
  onOpenChange,
}: {
  department: DepartmentRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!department) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${department.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Could not delete department");
        setLoading(false);
        return;
      }

      toast.success("Department deleted");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={department !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{department?.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {department && department.workerCount > 0
              ? `This department still has ${department.workerCount} worker(s). Move or remove them first.`
              : "This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading || (department?.workerCount ?? 0) > 0}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
