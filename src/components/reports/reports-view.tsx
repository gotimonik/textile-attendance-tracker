"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentBadge } from "@/components/department-badge";
import { TrendChart, type TrendPoint } from "@/components/dashboard/trend-chart";
import { todayKey, addDaysToKey, formatDisplayDate } from "@/lib/date";

type DepartmentOption = { id: string; name: string; color: string };

type ReportRow = {
  workerId: string;
  name: string;
  department: { id: string; name: string; color: string };
  isActive: boolean;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  holiday: number;
  markedDays: number;
  attendancePct: number;
};

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function pctColor(pct: number) {
  if (pct >= 90) return "#0ca30c";
  if (pct >= 75) return "#fab219";
  return "#d03b3b";
}

export function ReportsView({ departments }: { departments: DepartmentOption[] }) {
  const [rangeDays, setRangeDays] = useState("30");
  const [departmentId, setDepartmentId] = useState("all");
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  const toKey = todayKey();
  const fromKey = useMemo(() => addDaysToKey(toKey, -(Number(rangeDays) - 1)), [toKey, rangeDays]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const reportParams = new URLSearchParams({ from: fromKey, to: toKey });
    if (departmentId !== "all") reportParams.set("departmentId", departmentId);

    Promise.all([
      fetch(`/api/attendance/report?${reportParams.toString()}`).then((r) => r.json()),
      fetch(`/api/attendance/summary?days=${rangeDays}`).then((r) => r.json()),
    ])
      .then(([reportData, summaryData]) => {
        if (cancelled) return;
        setRows(reportData.rows);
        setTrend(summaryData.trend);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [fromKey, toKey, departmentId, rangeDays]);

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams({ from: fromKey, to: toKey });
    if (departmentId !== "all") params.set("departmentId", departmentId);
    return `/api/attendance/export?${params.toString()}`;
  }, [fromKey, toKey, departmentId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {formatDisplayDate(fromKey)} &mdash; {formatDisplayDate(toKey)}
          </p>
        </div>
        <Button asChild className="bg-gradient-brand text-white shadow-glow hover:opacity-95">
          <a href={exportUrl} download>
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={rangeDays} onValueChange={setRangeDays}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-heading">Attendance over time</CardTitle>
          <CardDescription>All departments &middot; last {rangeDays} days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading || !trend ? <Skeleton className="h-[280px] w-full rounded-lg" /> : <TrendChart data={trend} />}
        </CardContent>
      </Card>

      <Card className="border-border/70 py-0">
        <CardHeader className="pt-5">
          <CardTitle className="font-heading">Worker summary</CardTitle>
          <CardDescription>Attendance % = present + half credit for half-days, over marked days</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !rows ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <FileBarChart className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No attendance data in this range yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Worker</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Absent</TableHead>
                    <TableHead className="text-right">Half Day</TableHead>
                    <TableHead className="text-right">Leave</TableHead>
                    <TableHead className="text-right">Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.workerId}>
                      <TableCell className="font-medium">
                        {row.name}
                        {!row.isActive && (
                          <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DepartmentBadge name={row.department.name} color={row.department.color} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.present}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.absent}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.halfDay}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.leave}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className="inline-flex min-w-14 justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: `${pctColor(row.attendancePct)}1a`,
                            color: pctColor(row.attendancePct),
                          }}
                        >
                          {row.attendancePct}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
