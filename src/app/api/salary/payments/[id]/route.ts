import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";

/** Admin-only: unmark a month as paid (deletes the payment record). */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.salaryPayment.findFirst({
    where: { id, organizationId: org.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  await prisma.salaryPayment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
