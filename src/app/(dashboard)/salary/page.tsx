import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";
import { SalaryView } from "@/components/salary/salary-view";

export const dynamic = "force-dynamic";

export default async function SalaryPage() {
  const org = await getOrgSession();
  if (!org) redirect("/login");

  const departments = await prisma.department.findMany({
    where: { organizationId: org.organizationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true },
  });

  return <SalaryView departments={departments} />;
}
