"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  sublabel?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden border-border/70 py-0 shadow-sm transition-shadow hover:shadow-md">
        <div
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl"
          style={{ backgroundColor: accent || "var(--primary)" }}
          aria-hidden
        />
        <CardContent className="flex items-center gap-4 p-5">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            )}
            style={{ backgroundColor: accent || "var(--primary)" }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="font-heading text-2xl font-bold tabular-nums leading-tight">{value}</p>
            {sublabel && <p className="truncate text-xs text-muted-foreground">{sublabel}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
