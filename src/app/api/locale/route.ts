import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOrgSession, getWorkerSession } from "@/lib/session";
import { LOCALES, LOCALE_COOKIE } from "@/lib/i18n/config";

const localeSchema = z.object({ locale: z.enum(LOCALES) });

/**
 * Sets the UI language. Works whether or not anyone is signed in:
 * - Always sets a `locale` cookie, so the pre-login pages (login/signup/join)
 *   render in the chosen language immediately, for anyone including a worker
 *   who hasn't registered yet.
 * - If an admin or worker session exists, ALSO saves it to that person's own
 *   profile, so it follows them to any device they sign in from next.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = localeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid locale" }, { status: 400 });
  }
  const { locale } = parsed.data;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const [org, worker] = await Promise.all([getOrgSession(), getWorkerSession()]);
  if (org) {
    await prisma.adminUser.update({ where: { id: org.userId }, data: { locale } });
  }
  if (worker) {
    await prisma.worker.update({ where: { id: worker.workerId }, data: { locale } });
  }

  return NextResponse.json({ ok: true, locale });
}
