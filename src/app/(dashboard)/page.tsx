import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { getAttendanceSummary } from "@/lib/attendance-summary";
import { prisma } from "@/lib/prisma";
import { formatDisplayDate } from "@/lib/date";
import { getOrgSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { DepartmentBreakdown } from "@/components/dashboard/department-breakdown";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const org = await getOrgSession();
  if (!org) redirect("/login");

  const [summary, departmentCount, pendingCount] = await Promise.all([
    getAttendanceSummary(org.organizationId, 14),
    prisma.department.count({ where: { organizationId: org.organizationId } }),
    prisma.worker.count({
      where: { organizationId: org.organizationId, approvalStatus: "PENDING" },
    }),
  ]);

  const { today, trend, departments } = summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{formatDisplayDate(today.date)}</p>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            Good to see you <span className="text-gradient-brand">back</span>
          </h1>
        </div>
        <Button asChild className="bg-gradient-brand text-white shadow-glow hover:opacity-95">
          <Link href="/attendance">
            <Sparkles className="h-4 w-4" />
            Mark today&apos;s attendance
          </Link>
        </Button>
      </div>

      {pendingCount > 0 && (
        <Card className="border-none bg-gradient-brand-soft py-0">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              <span className="font-semibold">{pendingCount}</span> worker
              {pendingCount === 1 ? "" : "s"} self-registered and{" "}
              {pendingCount === 1 ? "is" : "are"} waiting for your approval.
            </p>
            <Button asChild size="sm" variant="outline" className="bg-background/70">
              <Link href="/workers">
                Review requests <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {today.totalWorkers > 0 && today.unmarked > 0 && (
        <Card className="border-none bg-gradient-brand-soft py-0">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm">
              <span className="font-semibold">{today.unmarked}</span> of{" "}
              <span className="font-semibold">{today.totalWorkers}</span> active workers haven&apos;t
              been marked for today yet.
            </p>
            <Button asChild size="sm" variant="outline" className="bg-background/70">
              <Link href="/attendance">
                Finish marking <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <DashboardStats today={today} departmentCount={departmentCount} />

      {/* Trend + department breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Attendance trend</CardTitle>
            <CardDescription>Last 14 days across all departments</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="font-heading">Today by department</CardTitle>
            <CardDescription>Present workers vs. headcount</CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentBreakdown rows={departments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
