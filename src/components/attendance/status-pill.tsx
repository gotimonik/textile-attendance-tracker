"use client";

import { Check, X, Clock3, Palmtree } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/colors";

type Status = keyof typeof STATUS_COLORS;

const OPTIONS: { status: Exclude<Status, "HOLIDAY">; icon: typeof Check; short: string }[] = [
  { status: "PRESENT", icon: Check, short: "P" },
  { status: "ABSENT", icon: X, short: "A" },
  { status: "HALF_DAY", icon: Clock3, short: "H" },
  { status: "LEAVE", icon: Palmtree, short: "L" },
];

export function StatusPillGroup({
  value,
  onChange,
}: {
  value: Status | null;
  onChange: (status: Status) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-muted/70 p-1">
      {OPTIONS.map(({ status, icon: Icon, short }) => {
        const active = value === status;
        const color = STATUS_COLORS[status];
        return (
          <button
            key={status}
            type="button"
            title={STATUS_LABELS[status]}
            aria-pressed={active}
            onClick={() => onChange(status)}
            className={cn(
              "flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-all",
              active ? "text-white shadow-sm" : "text-muted-foreground hover:bg-background/80"
            )}
            style={active ? { backgroundColor: color } : undefined}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{short}</span>
          </button>
        );
      })}
    </div>
  );
}
