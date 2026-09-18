"use client";

import { useState } from "react";
import { Menu, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "@/components/shell/sidebar-nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="border-b border-sidebar-border/60 px-4 py-4">
          <SheetTitle asChild>
            <span className="flex items-center gap-2 font-heading text-lg font-bold text-sidebar-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white">
                <Shirt className="h-4.5 w-4.5" />
              </span>
              ThreadTrack
            </span>
          </SheetTitle>
        </SheetHeader>
        <div className="py-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
