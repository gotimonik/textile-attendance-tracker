import { Suspense } from "react";
import { cookies } from "next/headers";
import { SignupForm } from "@/components/signup-form";
import { Shirt, Building2, Users, QrCode } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/translate";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = (key: string) => translate(locale, key);

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSwitcher variant="outline" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />

      {/* `isolate` gives this panel its own stacking context — see the
          matching comment in login/page.tsx for why it's needed. */}
      <div className="relative isolate hidden flex-1 flex-col justify-between p-12 text-white lg:flex">
        <div className="absolute inset-0 -z-10 bg-gradient-brand" />
        <div className="absolute inset-0 -z-10 bg-black/10" />

        <div className="flex items-center gap-2 text-lg font-heading font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Shirt className="h-5 w-5" />
          </span>
          ThreadTrack
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight">{t("signup.heroTitle")}</h1>
          <p className="text-base text-white/85">{t("signup.heroBody")}</p>
          <div className="space-y-3 pt-2">
            {[
              { icon: Building2, text: t("signup.feature1") },
              { icon: QrCode, text: t("signup.feature2") },
              { icon: Users, text: t("signup.feature3") },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/60">
          &copy; {new Date().getFullYear()} ThreadTrack. {t("auth.heroFooter")}
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
