"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { STATUS_COLORS, CHART_CHROME } from "@/lib/colors";
import { formatDisplayDate } from "@/lib/date";

export type TrendPoint = {
  date: string;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  presentPct: number;
};

function shortDate(dateKey: string) {
  const [, m, d] = dateKey.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[Number(m) - 1]}`;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const chrome = {
    grid: isDark ? CHART_CHROME.gridlineDark : CHART_CHROME.gridline,
    text: CHART_CHROME.mutedText,
  };

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: shortDate(d.date),
      })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: chrome.text }}
          tickLine={false}
          axisLine={{ stroke: chrome.grid }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11, fill: chrome.text }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.04)" }}
          contentStyle={{
            background: isDark ? "#17161a" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(11,11,11,0.1)"}`,
            borderRadius: 10,
            fontSize: 12,
          }}
          labelFormatter={(_, payload) => {
            const point = payload?.[0]?.payload as TrendPoint | undefined;
            return point ? formatDisplayDate(point.date) : "";
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        <Bar dataKey="present" name="Present" stackId="a" fill={STATUS_COLORS.PRESENT} radius={[0, 0, 0, 0]} />
        <Bar dataKey="halfDay" name="Half Day" stackId="a" fill={STATUS_COLORS.HALF_DAY} />
        <Bar dataKey="leave" name="On Leave" stackId="a" fill={STATUS_COLORS.LEAVE} />
        <Bar dataKey="absent" name="Absent" stackId="a" fill={STATUS_COLORS.ABSENT} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
