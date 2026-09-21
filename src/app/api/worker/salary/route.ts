import { NextResponse } from "next/server";
import { getWorkerSession } from "@/lib/session";
import { getWorkerSalaryLedger } from "@/lib/salary";

/** Worker-only: the signed-in worker's own payroll history, read-only. */
export async function GET() {
  const worker = await getWorkerSession();
  if (!worker) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ledger = await getWorkerSalaryLedger(worker.organizationId, worker.workerId);
  if (!ledger) return NextResponse.json({ error: "Worker not found" }, { status: 404 });

  return NextResponse.json(ledger);
}
