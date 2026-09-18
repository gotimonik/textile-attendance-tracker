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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentSection } from "@/components/attendance/department-section";
import { STATUS_COLORS } from "@/lib/colors";
import {
  todayKey,
  addDaysToKey,
  formatDisplayDate,
  dateKeyToLocalDate,
  localDateToDateKey,
} from "@/lib/date";

type Status = keyof typeof STATUS_COLORS;

type ApiWorker = { id: string; name: string; designation: string | null; status: Status | null };
type ApiDepartment = { id: string; name: string; color: string; workers: ApiWorker[] };

export function AttendanceView() {
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [departments, setDepartments] = useState<ApiDepartment[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Status | null>>({});
  const [original, setOriginal] = useState<Record<string, Status | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      for (const dept of data.departments as ApiDepartment[]) {
        for (const w of dept.workers) {
          map[w.id] = w.status;
        }
      }
      setStatuses(map);
      setOriginal(map);
    } catch {
      toast.error("Could not load attendance for this date");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateKey) fetchData(dateKey);
  }, [dateKey, fetchData]);

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
    toast.info("Marked everyone as Holiday for this date — click Save to confirm.");
  }

  async function handleSave() {
    if (!dateKey) return;
    const records = Object.entries(statuses)
      .filter(([, status]) => status !== null)
      .map(([workerId, status]) => ({ workerId, status }));

    if (records.length === 0) {
      toast.error("Nothing to save yet");
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
      toast.success(`Saved attendance for ${records.length} worker${records.length === 1 ? "" : "s"}`);
    } catch {
      toast.error("Could not save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const isToday = dateKey === todayKey();

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
            Mark attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateKey ? formatDisplayDate(dateKey) : "Loading…"}
            {isToday && <span className="ml-2 text-xs font-medium text-primary">Today</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => dateKey && setDateKey(addDaysToKey(dateKey, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {dateKey ? formatDisplayDate(dateKey).split(",")[0] : "Date"}
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
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Present", value: totals.present, icon: UserCheck, color: STATUS_COLORS.PRESENT },
          { label: "Absent", value: totals.absent, icon: UserX, color: STATUS_COLORS.ABSENT },
          { label: "Half Day", value: totals.halfDay, icon: Clock3, color: STATUS_COLORS.HALF_DAY },
          { label: "On Leave", value: totals.leave, icon: Palmtree, color: STATUS_COLORS.LEAVE },
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
          {totals.marked}/{totals.total} workers marked
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleMarkAllPresent()}>
            Mark all present
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkHoliday}>
            <PartyPopper className="h-3.5 w-3.5" />
            Mark as holiday
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
            No departments yet. Add a department and some workers first.
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
              {isDirty ? "You have unsaved changes" : "All changes saved"}
            </p>
            <Button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="bg-gradient-brand text-white shadow-glow hover:opacity-95"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save attendance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
