import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  color: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.department.findFirst({
    where: { id, organizationId: org.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const department = await prisma.department.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ department });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.department.findFirst({
    where: { id, organizationId: org.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Department not found" }, { status: 404 });
  }

  const workerCount = await prisma.worker.count({ where: { departmentId: id } });
  if (workerCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${workerCount} worker(s) still belong to this department` },
      { status: 409 }
    );
  }

  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
