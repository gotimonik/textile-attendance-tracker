import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type OrgSession = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  userId: string;
  username: string;
};

export type WorkerSession = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  workerId: string;
  workerName: string;
  departmentId: string;
  departmentName: string;
};

/** Server-only helper: resolves the signed-in admin's organization context, or null. */
export async function getOrgSession(): Promise<OrgSession | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (user?.role !== "admin" || !user.organizationId || !user.id || !user.username) return null;

  return {
    organizationId: user.organizationId,
    organizationName: user.organizationName ?? "",
    organizationSlug: user.organizationSlug ?? "",
    userId: user.id,
    username: user.username,
  };
}

/** Server-only helper: resolves the signed-in worker's own context, or null. */
export async function getWorkerSession(): Promise<WorkerSession | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (user?.role !== "worker" || !user.organizationId || !user.id) return null;

  return {
    organizationId: user.organizationId,
    organizationName: user.organizationName ?? "",
    organizationSlug: user.organizationSlug ?? "",
    workerId: user.id,
    workerName: user.name ?? "",
    departmentId: user.departmentId ?? "",
    departmentName: user.departmentName ?? "",
  };
}
