"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Save,
  Loader2,
  UserCheck,
  UserX,
  Clock3,
  Palmtree,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentSection } from "@/components/attendance/department-section";
import { AttendanceRangeView } from "@/components/attendance/attendance-range-view";
import { BulkMarkDialog } from "@/components/attendance/bulk-mark-dialog";
import { PendingVerificationView } from "@/components/attendance/pending-verification-view";
import { STATUS_COLORS } from "@/lib/colors";
import {
  todayKey,
  addDaysToKey,
  formatDisplayDate,
  formatMonthLabel,
  dateKeyToLocalDate,
  localDateToDateKey,
  monthKeyOf,
  monthKeyRange,
  currentMonthKey,
} from "@/lib/date";
import { useTranslation } from "@/lib/i18n/use-translation";

type Status = keyof typeof STATUS_COLORS;

type ApiWorker = { id: string; name: string; designation: string | null; status: Status | null; pending: boolean };
type ApiDepartment = { id: string; name: string; color: string; workers: ApiWorker[] };

export function AttendanceView() {
  const { t } = useTranslation();
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [departments, setDepartments] = useState<ApiDepartment[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Status | null>>({});
  const [original, setOriginal] = useState<Record<string, Status | null>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"day" | "week" | "month" | "pending">("day");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [rangeRefreshKey, setRangeRefreshKey] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setDateKey(todayKey());
  }, []);

  const fetchData = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${key}`);
      const data = await res.json();
      setDepartments(data.departments);
      const map: Record<string, Status | null> = {};
      const pendingMap: Record<string, boolean> = {};
      for (const dept of data.departments as ApiDepartment[]) {
        for (const w of dept.workers) {
          map[w.id] = w.status;
          pendingMap[w.id] = w.pending;
        }
      }
      setStatuses(map);
      setOriginal(map);
      setPending(pendingMap);
    } catch {
      toast.error(t("attendance.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/pending");
      const data = await res.json();
      setPendingCount((data.rows ?? []).length);
    } catch {
      // Non-critical — the badge just stays at its last known count.
    }
  }, []);

  useEffect(() => {
    if (dateKey) fetchData(dateKey);
  }, [dateKey, fetchData]);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  const isDirty = useMemo(() => {
    const keys = new Set([...Object.keys(statuses), ...Object.keys(original)]);
    for (const k of keys) {
      if (statuses[k] !== original[k]) return true;
    }
    return false;
  }, [statuses, original]);

  const totals = useMemo(() => {
    const values = Object.values(statuses);
    return {
      present: values.filter((v) => v === "PRESENT").length,
      absent: values.filter((v) => v === "ABSENT").length,
      halfDay: values.filter((v) => v === "HALF_DAY").length,
      leave: values.filter((v) => v === "LEAVE").length,
      total: values.length,
      marked: values.filter(Boolean).length,
    };
  }, [statuses]);

  function handleStatusChange(workerId: string, status: Status) {
    setStatuses((prev) => ({ ...prev, [workerId]: status }));
  }

  function handleMarkAllPresent(departmentId?: string) {
    if (!departments) return;
    setStatuses((prev) => {
      const next = { ...prev };
      for (const dept of departments) {
        if (departmentId && dept.id !== departmentId) continue;
        for (const w of dept.workers) next[w.id] = "PRESENT";
      }
      return next;
    });
  }

  function handleMarkHoliday() {
    if (!departments) return;
    setStatuses((prev) => {
      const next = { ...prev };
      for (const dept of departments) {
        for (const w of dept.workers) next[w.id] = "HOLIDAY";
      }
      return next;
    });
    toast.info(t("attendance.holidayToast"));
  }

  async function handleSave() {
    if (!dateKey) return;
    const records = Object.entries(statuses)
      .filter(([, status]) => status !== null)
      .map(([workerId, status]) => ({ workerId, status }));

    if (records.length === 0) {
      toast.error(t("attendance.nothingToSave"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, records }),
      });
      if (!res.ok) throw new Error();
      setOriginal(statuses);
      setPending((prev) => {
        const next = { ...prev };
        for (const { workerId } of records) next[workerId] = false;
        return next;
      });
      fetchPendingCount();
      toast.success(t("attendance.savedToast", { n: records.length }));
    } catch {
      toast.error(t("attendance.saveError"));
    } finally {
      setSaving(false);
    }
  }

  const isToday = dateKey === todayKey();

  const weekRange = dateKey ? { from: addDaysToKey(dateKey, -6), to: dateKey } : null;
  const monthKey = dateKey ? monthKeyOf(dateKey) : null;
  const monthRange = monthKey ? monthKeyRange(monthKey) : null;
  const activeRange = tab === "week" ? weekRange : tab === "month" ? monthRange : null;

  function handleRangeNav(delta: 1 | -1) {
    if (!dateKey) return;
    if (tab === "week") {
      setDateKey(addDaysToKey(dateKey, delta * 7));
    } else if (tab === "month" && monthKey) {
      const nextMonthKey =
        delta === 1
          ? monthKey.slice(0, 4) + "-" + String(Number(monthKey.slice(5)) + 1).padStart(2, "0")
          : monthKey.slice(0, 4) + "-" + String(Number(monthKey.slice(5)) - 1).padStart(2, "0");
      // Roll year over when month goes out of 01-12 range.
      let [y, m] = nextMonthKey.split("-").map(Number);
      if (m === 0) {
        m = 12;
        y -= 1;
      } else if (m === 13) {
        m = 1;
        y += 1;
      }
      const normalized = `${y}-${String(m).padStart(2, "0")}`;
      setDateKey(monthKeyRange(normalized).from);
    }
  }

  const rangeNavDisabled =
    tab === "week" ? weekRange?.to === todayKey() : tab === "month" ? monthKey === currentMonthKey() : false;

  function handleBulkSuccess() {
    if (dateKey) fetchData(dateKey);
    setRangeRefreshKey((k) => k + 1);
    fetchPendingCount();
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            {t("attendance.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tab === "day" && (dateKey ? formatDisplayDate(dateKey) : t("common.loading"))}
            {tab === "week" && weekRange && `${formatDisplayDate(weekRange.from)} — ${formatDisplayDate(weekRange.to)}`}
            {tab === "month" && monthKey && formatMonthLabel(monthKey)}
            {tab === "pending" && t("attendance.pendingSubtitle")}
            {tab === "day" && isToday && <span className="ml-2 text-xs font-medium text-primary">{t("attendance.todayBadge")}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === "day" ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => dateKey && setDateKey(addDaysToKey(dateKey, -1))}
                aria-label={t("attendance.previousDay")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateKey ? formatDisplayDate(dateKey).split(",")[0] : t("attendance.pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dateKey ? dateKeyToLocalDate(dateKey) : undefined}
                    onSelect={(d) => d && setDateKey(localDateToDateKey(d))}
                    disabled={{ after: new Date() }}
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                onClick={() => dateKey && setDateKey(addDaysToKey(dateKey, 1))}
                disabled={dateKey === todayKey()}
                aria-label={t("attendance.nextDay")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : tab === "pending" ? null : (
            <>
              <Button variant="outline" size="icon" onClick={() => handleRangeNav(-1)} aria-label={t("attendance.previous")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleRangeNav(1)} disabled={rangeNavDisabled} aria-label={t("attendance.next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="day">{t("attendance.tabDay")}</TabsTrigger>
            <TabsTrigger value="week">{t("attendance.tabWeek")}</TabsTrigger>
            <TabsTrigger value="month">{t("attendance.tabMonth")}</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              {t("attendance.tabPending")}
              {pendingCount > 0 && (
                <Badge className="h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] text-white">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {tab !== "pending" && (
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)} className="w-fit">
            <ListChecks className="h-3.5 w-3.5" />
            {t("attendance.bulkMark")}
          </Button>
        )}
      </div>

      {tab === "pending" && (
        <PendingVerificationView
          onChanged={() => {
            fetchPendingCount();
            if (dateKey) fetchData(dateKey);
            setRangeRefreshKey((k) => k + 1);
          }}
        />
      )}

      {tab !== "day" && tab !== "pending" && activeRange && (
        <AttendanceRangeView
          from={activeRange.from}
          to={activeRange.to}
          onSelectDate={(key) => {
            setDateKey(key);
            setTab("day");
          }}
          refreshKey={rangeRefreshKey}
        />
      )}

      {tab === "day" && (
        <>
      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("status.PRESENT"), value: totals.present, icon: UserCheck, color: STATUS_COLORS.PRESENT },
          { label: t("status.ABSENT"), value: totals.absent, icon: UserX, color: STATUS_COLORS.ABSENT },
          { label: t("status.HALF_DAY"), value: totals.halfDay, icon: Clock3, color: STATUS_COLORS.HALF_DAY },
          { label: t("status.LEAVE"), value: totals.leave, icon: Palmtree, color: STATUS_COLORS.LEAVE },
        ].map((chip) => (
          <Card key={chip.label} className="border-border/70 py-0">
            <CardContent className="flex items-center gap-3 p-3.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: chip.color }}
              >
                <chip.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-heading text-lg font-bold leading-tight tabular-nums">{chip.value}</p>
                <p className="text-xs text-muted-foreground">{chip.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("attendance.workersMarked", { marked: totals.marked, total: totals.total })}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMarkAllPresent()}>
            {t("attendance.markAllPresent")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkHoliday}>
            <PartyPopper className="h-3.5 w-3.5" />
            {t("attendance.markAsHoliday")}
          </Button>
        </div>
      </div>

      {/* Department sections */}
      {loading || !departments ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {t("attendance.noDepartmentsYet")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {departments.map((dept, i) => (
            <DepartmentSection
              key={dept.id}
              id={dept.id}
              name={dept.name}
              color={dept.color}
              workers={dept.workers}
              statuses={statuses}
              pending={pending}
              onStatusChange={handleStatusChange}
              onMarkAllPresent={handleMarkAllPresent}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Sticky save bar */}
      {departments && departments.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:pl-[calc(16rem+1.5rem)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isDirty ? t("attendance.unsavedChanges") : t("attendance.allChangesSaved")}
            </p>
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="bg-gradient-brand text-white shadow-glow hover:opacity-95"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("attendance.saveAttendance")}
            </Button>
          </div>
        </div>
      )}
        </>
      )}

      <BulkMarkDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        departments={departments ?? []}
        defaultFrom={activeRange?.from ?? dateKey ?? todayKey()}
        defaultTo={activeRange?.to ?? dateKey ?? todayKey()}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
