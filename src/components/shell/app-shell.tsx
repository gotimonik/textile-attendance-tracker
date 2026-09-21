"use client";

import Link from "next/link";
import { Shirt } from "lucide-react";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { MobileNav } from "@/components/shell/mobile-nav";
import { ThemeToggle } from "@/components/shell/theme-toggle";
import { UserMenu } from "@/components/shell/user-menu";
import { PageTransition } from "@/components/shell/page-transition";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useTranslation } from "@/lib/i18n/use-translation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border/60 bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-16 items-center gap-2 px-5 font-heading text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white">
            <Shirt className="h-4.5 w-4.5" />
          </span>
          ThreadTrack
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <SidebarNav />
        </div>
        <div className="border-t border-sidebar-border/60 p-4">
          <div className="rounded-xl bg-gradient-brand-soft p-3 text-xs text-sidebar-foreground/70">
            <p className="font-medium text-sidebar-foreground">{t("nav.sidebarTipTitle")}</p>
            <p className="mt-1">{t("nav.sidebarTipBody")}</p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen w-full flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link href="/" className="flex items-center gap-2 font-heading text-base font-bold lg:hidden">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand text-white">
                <Shirt className="h-4 w-4" />
              </span>
              ThreadTrack
            </Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
