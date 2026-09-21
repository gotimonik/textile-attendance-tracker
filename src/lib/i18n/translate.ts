import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { DICTIONARY } from "@/lib/i18n/dictionary";

type Vars = Record<string, string | number>;

function getPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

/**
 * Dot-path lookup into DICTIONARY[locale], e.g. t("nav.attendance"). Falls
 * back to the English string (then to the raw key) if the active locale is
 * missing it — a module still being translated should never render blank.
 *
 * Deliberately NOT marked "use client" — this module is imported directly by
 * Server Components (login/signup/dashboard-home pages) as well as by the
 * client-side useTranslation() hook. Next.js turns every export of a
 * "use client" module into a client-only reference, so translate() must live
 * in a plain module to be callable from both sides.
 */
export function translate(locale: Locale, key: string, vars?: Vars): string {
  const path = key.split(".");
  const value = getPath(DICTIONARY[locale], path);
  if (typeof value === "string") return interpolate(value, vars);

  const fallback = getPath(DICTIONARY[DEFAULT_LOCALE], path);
  if (typeof fallback === "string") return interpolate(fallback, vars);

  return key;
}
