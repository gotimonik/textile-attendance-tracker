"use client";

import { Check, X, Clock3, Palmtree } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/colors";
import { useTranslation } from "@/lib/i18n/use-translation";

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
  const { t } = useTranslation();
  return (
    <div className="flex w-full items-center gap-1.5 rounded-xl bg-muted/70 p-1 sm:w-auto sm:inline-flex sm:gap-1">
      {OPTIONS.map(({ status, icon: Icon, short }) => {
        const active = value === status;
        const color = STATUS_COLORS[status];
        return (
          <button
            key={status}
            type="button"
            title={t(`status.${status}`)}
            aria-pressed={active}
            onClick={() => onChange(status)}
            className={cn(
              // On phones this group now has its own full-width row (see
              // department-section.tsx), so flex-1 lets each button claim
              // an even, generous share of that width instead of relying on
              // a fixed min-width that used to fight the worker's name for
              // space. A mis-tap here marks the wrong attendance status —
              // a real wrong-pay bug — so bigger, evenly-spaced targets on
              // touch devices matter more than density. Shrinks back to a
              // compact inline row at sm+ where there's a mouse and the row
              // no longer needs the full card width.
              "flex h-11 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-all sm:h-8 sm:flex-none sm:min-w-8",
              active ? "text-white shadow-sm" : "text-muted-foreground hover:bg-background/80"
            )}
            style={active ? { backgroundColor: color } : undefined}
          >
            <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">{short}</span>
          </button>
        );
      })}
    </div>
  );
}
