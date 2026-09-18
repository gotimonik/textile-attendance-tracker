"use client";

import { motion } from "framer-motion";

export type DepartmentBreakdownRow = {
  id: string;
  name: string;
  color: string;
  totalWorkers: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  presentPct: number;
};

export function DepartmentBreakdown({ rows }: { rows: DepartmentBreakdownRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No departments yet. Add one to see today&apos;s breakdown.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row, i) => (
        <motion.div
          key={row.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
              <span className="truncate">{row.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {row.present}/{row.totalWorkers} &middot;{" "}
              <span className="font-semibold text-foreground">{row.presentPct}%</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: row.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(row.presentPct, 100)}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
