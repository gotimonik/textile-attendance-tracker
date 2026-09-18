import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";
import { DepartmentsView } from "@/components/departments/departments-view";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const org = await getOrgSession();
  if (!org) redirect("/login");

  const departments = await prisma.department.findMany({
    where: { organizationId: org.organizationId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { workers: true } } },
  });

  const initial = departments.map((d) => ({
    id: d.id,
    name: d.name,
    color: d.color,
    workerCount: d._count.workers,
  }));

  return <DepartmentsView initialDepartments={initial} />;
}
