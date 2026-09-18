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

export function DeleteWorkerDialog({
  worker,
  onOpenChange,
}: {
  worker: WorkerRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!worker) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${worker.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Worker deleted");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Could not delete worker");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={worker !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{worker?.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the worker and all of their attendance history. This action
            cannot be undone. Consider marking them inactive instead if you may need this record
            later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
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
