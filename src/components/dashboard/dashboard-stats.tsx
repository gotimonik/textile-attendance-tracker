"use client";

import { Users, UserCheck, UserX, CalendarClock } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

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
  const markedCount = today.present + today.absent + today.halfDay + today.leave + today.holiday;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        index={0}
        label="Active Workers"
        value={today.totalWorkers}
        icon={Users}
        accent="#4a3aa7"
        sublabel={`Across ${departmentCount} department${departmentCount === 1 ? "" : "s"}`}
      />
      <StatCard
        index={1}
        label="Present Today"
        value={today.present}
        icon={UserCheck}
        accent="#0ca30c"
        sublabel={
          markedCount > 0 ? `${Math.round((today.present / markedCount) * 100)}% of marked` : "Not marked yet"
        }
      />
      <StatCard
        index={2}
        label="Absent Today"
        value={today.absent}
        icon={UserX}
        accent="#d03b3b"
        sublabel={`${today.halfDay} half-day, ${today.leave} on leave`}
      />
      <StatCard
        index={3}
        label="Yet to Mark"
        value={today.unmarked}
        icon={CalendarClock}
        accent="#eda100"
        sublabel={today.unmarked === 0 ? "All caught up" : "Needs attention"}
      />
    </div>
  );
}
