import type { Prisma } from "@prisma/client";

/** Shared Prisma `select` for worker API responses — includes pinHash only so
 * toClientWorker() can derive `hasPin`; every route must call it before
 * responding so the hash itself never reaches the client. */
export const workerSelect = {
  id: true,
  name: true,
  designation: true,
  phone: true,
  isActive: true,
  joiningDate: true,
  approvalStatus: true,
  source: true,
  pinHash: true,
  monthlySalary: true,
  department: true,
} satisfies Prisma.WorkerSelect;

export type RawWorker = Prisma.WorkerGetPayload<{ select: typeof workerSelect }>;

export function toClientWorker(worker: RawWorker) {
  const { pinHash, ...rest } = worker;
  return { ...rest, hasPin: pinHash !== null };
}
