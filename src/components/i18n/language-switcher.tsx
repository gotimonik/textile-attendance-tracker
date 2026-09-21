"use client";

import { useState } from "react";
import { Languages, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Works both signed out (login/signup/join — sets a cookie only) and signed
 * in (worker/admin — the API route also saves it to that person's profile,
 * per "saved per-worker"). Either way we do a full page reload after saving
 * rather than a client-side refresh: the new locale has to come back down
 * through the server render (cookie or DB value -> LocaleProvider), and a
 * reload is the simplest way to guarantee every part of the page — including
 * server components — picks it up correctly.
 */
export function LanguageSwitcher({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "outline";
  className?: string;
}) {
  const { locale, t } = useTranslation();
  const [pending, setPending] = useState<Locale | null>(null);

  async function choose(next: Locale) {
    if (next === locale || pending) return;
    setPending(next);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
    } finally {
      window.location.reload();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={`rounded-full ${className ?? ""}`}
          aria-label={t("common.language")}
        >
          {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Languages className="h-4.5 w-4.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => choose(l)} className="justify-between">
            {LOCALE_LABELS[l]}
            {l === locale && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
