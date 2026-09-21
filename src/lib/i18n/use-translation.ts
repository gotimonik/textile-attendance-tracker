"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/translate";

type Vars = Record<string, string | number>;

export type TranslationContextValue = {
  locale: Locale;
  t: (key: string, vars?: Vars) => string;
};

export const TranslationContext = createContext<TranslationContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key: string, vars?: Vars) => translate(DEFAULT_LOCALE, key, vars),
});

/** Client-only: read the current locale and translate() bound to it. */
export function useTranslation(): TranslationContextValue {
  return useContext(TranslationContext);
}
