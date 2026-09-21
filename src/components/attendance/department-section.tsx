"use client";

import { motion } from "framer-motion";
import { CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusPillGroup } from "@/components/attendance/status-pill";
import { STATUS_COLORS } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n/use-translation";

export type AttendanceWorker = {
  id: string;
  name: string;
  designation: string | null;
};

type Status = keyof typeof STATUS_COLORS;

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function DepartmentSection({
  id,
  name,
  color,
  workers,
  statuses,
  pending,
  onStatusChange,
  onMarkAllPresent,
  index = 0,
}: {
  id: string;
  name: string;
  color: string;
  workers: AttendanceWorker[];
  statuses: Record<string, Status | null>;
  pending?: Record<string, boolean>;
  onStatusChange: (workerId: string, status: Status) => void;
  onMarkAllPresent: (departmentId: string) => void;
  index?: number;
}) {
  const { t } = useTranslation();
  const markedCount = workers.filter((w) => statuses[w.id]).length;
  const presentCount = workers.filter((w) => statuses[w.id] === "PRESENT").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden border-border/70 py-0">
        <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border/60 bg-muted/30 py-4">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            <div>
              <p className="font-heading font-semibold leading-tight">{name}</p>
              <p className="text-xs text-muted-foreground">
                {t("attendance.presentMarked", { present: presentCount, marked: markedCount, total: workers.length })}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onMarkAllPresent(id)}>
            <CheckCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("attendance.markAllPresent")}</span>
            <span className="sm:hidden">{t("attendance.markAllPresentShort")}</span>
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 p-0">
          {workers.map((w) => (
            <div
              key={w.id}
              className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0 border border-border">
                  <AvatarFallback className="text-xs font-semibold text-white" style={{ backgroundColor: color }}>
                    {initialsOf(w.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{w.name}</p>
                  {w.designation && (
                    <p className="truncate text-xs text-muted-foreground">{w.designation}</p>
                  )}
                  {pending?.[w.id] && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      {t("attendance.pendingVerificationBadge")}
                    </p>
                  )}
                </div>
              </div>
              {/* Full-width on phones — this used to share the row with the
                  name, but once the tap targets were sized up for accuracy
                  there wasn't room left for the name, which just got
                  truncated to one or two letters. A worker's own name is
                  the one thing you must be able to see before marking
                  their attendance, so it gets its own row on mobile. */}
              <div className="sm:shrink-0">
                <StatusPillGroup
                  value={statuses[w.id] ?? null}
                  onChange={(status) => onStatusChange(w.id, status)}
                />
              </div>
            </div>
          ))}
          {workers.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              {t("attendance.noActiveWorkersInDept")}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
