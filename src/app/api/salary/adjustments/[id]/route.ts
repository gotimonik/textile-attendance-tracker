import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.salaryAdjustment.findFirst({
    where: { id, organizationId: org.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Adjustment not found" }, { status: 404 });
  }

  await prisma.salaryAdjustment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
