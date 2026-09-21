"use client";

import { signOut } from "next-auth/react";
import { LogOut, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslation } from "@/lib/i18n/use-translation";

export function WorkerHeader({
  workerName,
  departmentName,
  organizationName,
}: {
  workerName: string;
  departmentName: string;
  organizationName: string;
}) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white">
            <Shirt className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{workerName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {departmentName} · {organizationName}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("common.signOut")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
