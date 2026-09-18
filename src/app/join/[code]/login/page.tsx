import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkerLoginForm } from "@/components/worker-login-form";
import { Shirt } from "lucide-react";

export default async function WorkerLoginPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const organization = await prisma.organization.findUnique({
    where: { inviteCode: code },
    select: { name: true },
  });

  if (!organization) {
    notFound();
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full opacity-25 blur-3xl"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 font-heading text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white">
            <Shirt className="h-5 w-5" />
          </span>
          ThreadTrack
        </div>
        <WorkerLoginForm code={code} organizationName={organization.name} />
      </div>
    </div>
  );
}
