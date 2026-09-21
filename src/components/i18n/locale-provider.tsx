"use client";

import { useCallback, useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { TranslationContext } from "@/lib/i18n/use-translation";
import { translate } from "@/lib/i18n/translate";

/**
 * Wraps a subtree in the current locale, resolved SERVER-SIDE by the caller
 * (from the locale cookie for anonymous pages, or from the signed-in user's
 * saved locale for the dashboard/worker portal) and passed in as a plain
 * prop. It's never read from localStorage/cookies here on the client during
 * render — doing that would make the client's first render disagree with
 * the server-rendered HTML, exactly the hydration-mismatch bug class this
 * app already ran into once (see workers-view.tsx's invite link fix).
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [
    locale,
  ]);
  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}
