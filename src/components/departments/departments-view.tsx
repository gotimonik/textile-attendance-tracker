"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, MoreVertical, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DepartmentDialog } from "@/components/departments/department-dialog";
import { DeleteDepartmentDialog } from "@/components/departments/delete-department-dialog";

export type DepartmentRow = {
  id: string;
  name: string;
  color: string;
  workerCount: number;
};

export function DepartmentsView({ initialDepartments }: { initialDepartments: DepartmentRow[] }) {
  const [dialogState, setDialogState] = useState<
    { mode: "create" } | { mode: "edit"; department: DepartmentRow } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRow | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            Departments
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize your floor into departments and track headcount per team.
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ mode: "create" })}
          className="bg-gradient-brand text-white shadow-glow hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Add department
        </Button>
      </div>

      {initialDepartments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand-soft">
              <Building2 className="h-6 w-6 text-primary" />
            </span>
            <div>
              <p className="font-medium">No departments yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first department to start organizing workers.
              </p>
            </div>
            <Button onClick={() => setDialogState({ mode: "create" })} className="bg-gradient-brand text-white">
              <Plus className="h-4 w-4" />
              Add department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialDepartments.map((dept, i) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Card className="group relative overflow-hidden border-border/70 py-0 transition-shadow hover:shadow-md">
                <div className="h-1.5 w-full" style={{ backgroundColor: dept.color }} />
                <CardContent className="flex items-start justify-between gap-3 p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: dept.color }}
                    >
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-heading font-semibold">{dept.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {dept.workerCount} worker{dept.workerCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-60 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDialogState({ mode: "edit", department: dept })}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(dept)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <DepartmentDialog
        state={dialogState}
        onOpenChange={(open) => !open && setDialogState(null)}
      />
      <DeleteDepartmentDialog department={deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} />
    </div>
  );
}
