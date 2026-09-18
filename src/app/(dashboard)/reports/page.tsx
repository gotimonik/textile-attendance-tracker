import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";
import { ReportsView } from "@/components/reports/reports-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const org = await getOrgSession();
  if (!org) redirect("/login");

  const departments = await prisma.department.findMany({
    where: { organizationId: org.organizationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true },
  });

  return <ReportsView departments={departments} />;
}
