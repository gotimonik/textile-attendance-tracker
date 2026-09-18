import { redirect } from "next/navigation";
import { getWorkerSession } from "@/lib/session";
import { WorkerHeader } from "@/components/worker/worker-header";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const worker = await getWorkerSession();
  if (!worker) redirect("/login");

  return (
    <div className="min-h-screen w-full bg-background">
      <WorkerHeader
        workerName={worker.workerName}
        departmentName={worker.departmentName}
        organizationName={worker.organizationName}
      />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
