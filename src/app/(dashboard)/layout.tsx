import { AppShell } from "@/components/shell/app-shell";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getOrgSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  // Overrides the root layout's cookie-based locale with the signed-in
  // admin's own saved language — resolved fresh from the database on every
  // request (never cached in the session/JWT) so a change from the language
  // switcher takes effect on the very next page load, from any device.
  const org = await getOrgSession();
  let locale = DEFAULT_LOCALE;
  if (org) {
    const admin = await prisma.adminUser.findUnique({ where: { id: org.userId }, select: { locale: true } });
    if (isLocale(admin?.locale)) locale = admin.locale;
  }

  return (
    <LocaleProvider locale={locale}>
      <AppShell>{children}</AppShell>
    </LocaleProvider>
  );
}
