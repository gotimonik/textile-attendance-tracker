"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Phone,
  Users2,
  Check,
  X,
  Copy,
  Link2,
  UserPlus,
  KeyRound,
  MessageCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { DepartmentBadge } from "@/components/department-badge";
import { WorkerDialog } from "@/components/workers/worker-dialog";
import { DeleteWorkerDialog } from "@/components/workers/delete-worker-dialog";
import { PinDialog } from "@/components/workers/pin-dialog";
import { useTranslation } from "@/lib/i18n/use-translation";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type WorkerSource = "ADMIN" | "SELF";

export type WorkerRow = {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  isActive: boolean;
  joiningDate: string;
  approvalStatus: ApprovalStatus;
  source: WorkerSource;
  hasPin: boolean;
  monthlySalary: number | null;
  department: { id: string; name: string; color: string };
};

export type DepartmentOption = { id: string; name: string; color: string };

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InviteLinkCard({
  organizationName,
  joinPath,
}: {
  organizationName: string;
  joinPath: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  // Starts null and is only filled in client-side after mount — reading
  // window.location.origin during the initial render (client or server) would
  // make the very first client render disagree with the server-rendered HTML
  // (a relative joinPath has no origin to read), which is what a hydration
  // mismatch is. Falling back to the relative joinPath keeps both renders
  // identical until this effect patches in the absolute URL.
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const fullUrl = origin && joinPath ? `${origin}${joinPath}` : joinPath;

  async function handleCopy() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success(t("workers.copiedToast"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("workers.copyError"));
    }
  }

  if (!joinPath) return null;

  const whatsappText = `Join ${organizationName || "our workspace"} on the attendance app — sign up and log in here: ${fullUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <Card className="border-none bg-gradient-brand-soft py-0">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/70">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">{t("workers.inviteLinkTitle")}</p>
            <p className="text-xs text-muted-foreground">
              {t("workers.inviteLinkDesc", { org: organizationName || "your workspace" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Input readOnly value={fullUrl} className="bg-background/70 text-xs sm:w-64" onFocus={(e) => e.target.select()} />
          <Button size="sm" variant="outline" className="bg-background/70 shrink-0" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {t("workers.copy")}
          </Button>
          <Button size="sm" variant="outline" className="bg-background/70 shrink-0" asChild>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("workers.whatsapp")}</span>
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkersView({
  initialWorkers,
  departments,
  joinPath,
  organizationName,
}: {
  initialWorkers: WorkerRow[];
  departments: DepartmentOption[];
  joinPath?: string;
  organizationName?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const [dialogState, setDialogState] = useState<
    { mode: "create" } | { mode: "edit"; worker: WorkerRow } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkerRow | null>(null);
  const [pinTarget, setPinTarget] = useState<WorkerRow | null>(null);

  const pendingWorkers = useMemo(
    () => initialWorkers.filter((w) => w.approvalStatus === "PENDING"),
    [initialWorkers]
  );

  const decidedWorkers = useMemo(
    () => initialWorkers.filter((w) => w.approvalStatus !== "PENDING"),
    [initialWorkers]
  );

  const filtered = useMemo(() => {
    return decidedWorkers.filter((w) => {
      if (deptFilter !== "all" && w.department.id !== deptFilter) return false;
      if (statusFilter === "active" && !w.isActive) return false;
      if (statusFilter === "inactive" && w.isActive) return false;
      if (statusFilter === "rejected" && w.approvalStatus !== "REJECTED") return false;
      if (statusFilter !== "rejected" && w.approvalStatus === "REJECTED") return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${w.name} ${w.designation ?? ""} ${w.phone ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [decidedWorkers, search, deptFilter, statusFilter]);

  async function toggleActive(worker: WorkerRow) {
    try {
      const res = await fetch(`/api/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !worker.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(worker.isActive ? t("workers.toggleActiveSuccessInactive") : t("workers.toggleActiveSuccessActive"));
      router.refresh();
    } catch {
      toast.error(t("workers.toggleActiveError"));
    }
  }

  async function decide(worker: WorkerRow, approvalStatus: "APPROVED" | "REJECTED") {
    setDecidingId(worker.id);
    try {
      const res = await fetch(`/api/workers/${worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        approvalStatus === "APPROVED"
          ? t("workers.approveSuccess", { name: worker.name })
          : t("workers.rejectSuccess", { name: worker.name })
      );
      router.refresh();
    } catch {
      toast.error(t("workers.decideError"));
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">{t("workers.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("workers.activeWorkersSub", {
              n: decidedWorkers.filter((w) => w.isActive && w.approvalStatus === "APPROVED").length,
            })}
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ mode: "create" })}
          disabled={departments.length === 0}
          className="bg-gradient-brand text-white shadow-glow hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          {t("workers.addWorker")}
        </Button>
      </div>

      {joinPath && <InviteLinkCard organizationName={organizationName ?? ""} joinPath={joinPath} />}

      {pendingWorkers.length > 0 && (
        <Card className="border-border/70">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                {t("workers.pendingSelfRegSub", { n: pendingWorkers.length })}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pendingWorkers.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback
                        className="text-xs font-semibold text-white"
                        style={{ backgroundColor: w.department.color }}
                      >
                        {initialsOf(w.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">{w.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{w.department.name}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-transparent bg-[color-mix(in_oklab,#0ca30c_15%,transparent)] text-[#0ca30c] hover:bg-[color-mix(in_oklab,#0ca30c_25%,transparent)]"
                      disabled={decidingId === w.id}
                      onClick={() => decide(w, "APPROVED")}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-transparent bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      disabled={decidingId === w.id}
                      onClick={() => decide(w, "REJECTED")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {departments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            {t("workers.createDeptFirst")}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("workers.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("workers.deptFilterPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("workers.allDepartments")}</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("workers.statusFilterPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">{t("workers.statusActive")}</SelectItem>
            <SelectItem value="inactive">{t("workers.statusInactive")}</SelectItem>
            <SelectItem value="rejected">{t("workers.statusRejected")}</SelectItem>
            <SelectItem value="all">{t("workers.statusAll")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Users2 className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{t("workers.noWorkersFound")}</p>
            <p className="text-sm text-muted-foreground">{t("workers.adjustFilters")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden border-border/70 py-0 lg:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("workers.colWorker")}</TableHead>
                  <TableHead>{t("workers.colDepartment")}</TableHead>
                  <TableHead>{t("workers.colContact")}</TableHead>
                  <TableHead>{t("workers.colStatus")}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback
                            className="text-xs font-semibold text-white"
                            style={{ backgroundColor: w.department.color }}
                          >
                            {initialsOf(w.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="flex items-center gap-1.5 font-medium leading-tight">
                            {w.name}
                            {w.source === "SELF" && (
                              <Badge
                                variant="outline"
                                className="border-transparent bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
                              >
                                {t("workers.selfSignUp")}
                              </Badge>
                            )}
                          </p>
                          {w.designation && (
                            <p className="text-xs text-muted-foreground">{w.designation}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DepartmentBadge name={w.department.name} color={w.department.color} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {w.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {w.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                      {w.hasPin && (
                        <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/80">
                          <KeyRound className="h-3 w-3" /> {t("workers.loginEnabled")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {w.approvalStatus === "REJECTED" ? (
                        <Badge
                          variant="outline"
                          className="border-transparent bg-destructive/10 text-destructive"
                        >
                          {t("workers.statusRejected")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className={
                            w.isActive
                              ? "border-transparent bg-[color-mix(in_oklab,#0ca30c_15%,transparent)] text-[#0ca30c]"
                              : "border-transparent bg-muted text-muted-foreground"
                          }
                        >
                          {w.isActive ? t("workers.statusActive") : t("workers.statusInactive")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDialogState({ mode: "edit", worker: w })}>
                            <Pencil className="h-4 w-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPinTarget(w)}>
                            <KeyRound className="h-4 w-4" />
                            {w.hasPin ? t("workers.resetPin") : t("workers.setPin")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleActive(w)}>
                            <Power className="h-4 w-4" />
                            {w.isActive ? t("workers.markInactive") : t("workers.markActive")}
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(w)}>
                            <Trash2 className="h-4 w-4" />
                            {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filtered.map((w) => (
              <Card key={w.id} className="border-border/70 py-0">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback
                        className="text-xs font-semibold text-white"
                        style={{ backgroundColor: w.department.color }}
                      >
                        {initialsOf(w.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium leading-tight">
                        {w.name}
                        {w.source === "SELF" && (
                          <Badge
                            variant="outline"
                            className="border-transparent bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
                          >
                            {t("workers.selfSignUp")}
                          </Badge>
                        )}
                      </p>
                      {w.designation && <p className="text-xs text-muted-foreground">{w.designation}</p>}
                      <div className="mt-1.5">
                        <DepartmentBadge name={w.department.name} color={w.department.color} />
                      </div>
                      {w.phone && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {w.phone}
                        </p>
                      )}
                      {w.hasPin && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/80">
                          <KeyRound className="h-3 w-3" /> {t("workers.loginEnabled")}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDialogState({ mode: "edit", worker: w })}>
                        <Pencil className="h-4 w-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPinTarget(w)}>
                        <KeyRound className="h-4 w-4" />
                        {w.hasPin ? t("workers.resetPin") : t("workers.setPin")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(w)}>
                        <Power className="h-4 w-4" />
                        {w.isActive ? t("workers.markInactive") : t("workers.markActive")}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(w)}>
                        <Trash2 className="h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <WorkerDialog state={dialogState} departments={departments} onOpenChange={(open) => !open && setDialogState(null)} />
      <DeleteWorkerDialog worker={deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} />
      <PinDialog worker={pinTarget} onOpenChange={(open) => !open && setPinTarget(null)} />
    </div>
  );
}
