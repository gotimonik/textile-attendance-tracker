import { Suspense } from "react";
import { cookies } from "next/headers";
import { LoginForm } from "@/components/login-form";
import { Shirt, Sparkles, Scissors, Palette } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/translate";

export default async function LoginPage() {
  // Server Component, so it resolves the cookie-based locale directly rather
  // than the useTranslation() hook (that needs a client-side React context).
  // translate() is imported from the plain (non "use client") module so it
  // can be called directly from a Server Component.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = (key: string) => translate(locale, key);

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <LanguageSwitcher variant="outline" />
      </div>
      {/* Ambient background glow */}
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

      {/* Left brand / hero panel */}
      {/* `isolate` gives this panel its own stacking context — without it,
          `position:relative` alone doesn't create one, so the -z-10
          background divs below escape to the page's root stacking context
          and lose to the "ambient background glow" divs and other content
          instead of staying pinned behind this panel's own text. The
          symptom: a washed-out panel with the vivid brand gradient barely
          visible and white text nearly invisible against it. */}
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
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight">{t("auth.heroTitle")}</h1>
          <p className="text-base text-white/85">{t("auth.heroBody")}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { icon: Scissors, label: t("auth.tagCutting") },
              { icon: Sparkles, label: t("auth.tagEmbroidery") },
              { icon: Palette, label: t("auth.tagDyeing") },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/60">
          &copy; {new Date().getFullYear()} ThreadTrack. {t("auth.heroFooter")}
        </p>
      </div>

      {/* Right login form panel */}
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
