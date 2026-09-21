import { redirect } from "next/navigation";
import { getWorkerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { WorkerHeader } from "@/components/worker/worker-header";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const worker = await getWorkerSession();
  if (!worker) redirect("/login");

  // Overrides the root layout's cookie-based locale with this worker's own
  // saved language — resolved fresh from the database on every request so a
  // change from the language switcher takes effect immediately, on any
  // device they sign in from (per "saved per-worker").
  const record = await prisma.worker.findUnique({ where: { id: worker.workerId }, select: { locale: true } });
  const locale = isLocale(record?.locale) ? record.locale : DEFAULT_LOCALE;

  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-screen w-full bg-background">
        <WorkerHeader
          workerName={worker.workerName}
          departmentName={worker.departmentName}
          organizationName={worker.organizationName}
        />
        <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </LocaleProvider>
  );
}
