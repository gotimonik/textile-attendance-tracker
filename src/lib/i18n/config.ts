export const LOCALES = ["en", "hi", "gu"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Each language's own name, in its own script — shown in the switcher itself
// rather than translated, the way real-world language pickers do it (so it's
// legible to someone who can't read the *other* options).
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export const LOCALE_COOKIE = "locale";
