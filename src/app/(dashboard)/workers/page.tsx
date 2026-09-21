import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";
import { WorkersView } from "@/components/workers/workers-view";
import { buildJoinPath } from "@/lib/org";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const org = await getOrgSession();
  if (!org) redirect("/login");

  const [workers, departments, organization] = await Promise.all([
    prisma.worker.findMany({
      where: { organizationId: org.organizationId },
      include: { department: true },
      orderBy: [{ approvalStatus: "asc" }, { isActive: "desc" }, { name: "asc" }],
    }),
    prisma.department.findMany({
      where: { organizationId: org.organizationId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organization.findUnique({
      where: { id: org.organizationId },
      select: { name: true, inviteCode: true },
    }),
  ]);

  const initialWorkers = workers.map((w) => ({
    id: w.id,
    name: w.name,
    designation: w.designation,
    phone: w.phone,
    isActive: w.isActive,
    joiningDate: w.joiningDate.toISOString(),
    approvalStatus: w.approvalStatus,
    source: w.source,
    hasPin: w.pinHash !== null,
    monthlySalary: w.monthlySalary,
    department: { id: w.department.id, name: w.department.name, color: w.department.color },
  }));

  const departmentOptions = departments.map((d) => ({ id: d.id, name: d.name, color: d.color }));

  return (
    <WorkersView
      initialWorkers={initialWorkers}
      departments={departmentOptions}
      joinPath={organization ? buildJoinPath(organization.inviteCode) : ""}
      organizationName={organization?.name ?? ""}
    />
  );
}
