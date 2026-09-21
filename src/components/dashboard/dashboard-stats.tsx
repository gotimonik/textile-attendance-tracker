"use client";

import { Users, UserCheck, UserX, CalendarClock } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { useTranslation } from "@/lib/i18n/use-translation";

export type TodaySummary = {
  date: string;
  totalWorkers: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  unmarked: number;
};

export function DashboardStats({
  today,
  departmentCount,
}: {
  today: TodaySummary;
  departmentCount: number;
}) {
  const { t } = useTranslation();
  const markedCount = today.present + today.absent + today.halfDay + today.leave + today.holiday;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        index={0}
        label={t("dashboard.statActiveWorkers")}
        value={today.totalWorkers}
        icon={Users}
        accent="#4a3aa7"
        sublabel={t("dashboard.statActiveWorkersSub", { n: departmentCount })}
      />
      <StatCard
        index={1}
        label={t("dashboard.statPresentToday")}
        value={today.present}
        icon={UserCheck}
        accent="#0ca30c"
        sublabel={
          markedCount > 0
            ? t("dashboard.statPresentPct", { pct: Math.round((today.present / markedCount) * 100) })
            : t("dashboard.statNotMarkedYet")
        }
      />
      <StatCard
        index={2}
        label={t("dashboard.statAbsentToday")}
        value={today.absent}
        icon={UserX}
        accent="#d03b3b"
        sublabel={t("dashboard.statAbsentSub", { halfDay: today.halfDay, leave: today.leave })}
      />
      <StatCard
        index={3}
        label={t("dashboard.statYetToMark")}
        value={today.unmarked}
        icon={CalendarClock}
        accent="#eda100"
        sublabel={today.unmarked === 0 ? t("dashboard.statAllCaughtUp") : t("dashboard.statNeedsAttention")}
      />
    </div>
  );
}
