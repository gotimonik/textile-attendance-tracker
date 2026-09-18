import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { departmentColor } from "@/lib/colors";
import { getOrgSession } from "@/lib/session";

export async function GET() {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const departments = await prisma.department.findMany({
    where: { organizationId: org.organizationId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { workers: true } },
    },
  });

  return NextResponse.json({ departments });
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  color: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const org = await getOrgSession();
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const existing = await prisma.department.findFirst({
    where: { name: parsed.data.name, organizationId: org.organizationId },
  });
  if (existing) {
    return NextResponse.json({ error: "A department with this name already exists" }, { status: 409 });
  }

  const count = await prisma.department.count({ where: { organizationId: org.organizationId } });

  const department = await prisma.department.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color || departmentColor(count),
      organizationId: org.organizationId,
    },
  });

  return NextResponse.json({ department }, { status: 201 });
}
