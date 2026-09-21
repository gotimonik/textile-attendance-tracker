"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, Shirt, Building2, User, KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n/use-translation";

export function SignupForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    adminName: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t("signup.genericError"));
        setLoading(false);
        return;
      }

      const signInRes = await signIn("admin-login", {
        username: form.username,
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.success(t("signup.orgCreatedSignIn"));
        router.push("/login");
        return;
      }

      toast.success(t("signup.orgCreatedWelcome"));
      router.push("/");
      router.refresh();
    } catch {
      toast.error(t("signup.networkError"));
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="mb-6 flex items-center gap-2 font-heading text-lg font-bold lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white">
          <Shirt className="h-5 w-5" />
        </span>
        ThreadTrack
      </div>

      <Card className="glass-card shadow-glow border-none py-0 shadow-xl">
        <CardHeader className="pt-8">
          <CardTitle className="font-heading text-2xl">{t("signup.title")}</CardTitle>
          <CardDescription>{t("signup.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">{t("signup.orgName")}</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="organizationName"
                  placeholder={t("signup.orgNamePlaceholder")}
                  className="pl-9"
                  value={form.organizationName}
                  onChange={(e) => setForm((f) => ({ ...f, organizationName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">{t("signup.yourName")}</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="adminName"
                  placeholder={t("signup.yourNamePlaceholder")}
                  className="pl-9"
                  value={form.adminName}
                  onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{t("signup.username")}</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="admin"
                  className="pl-9"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("signup.password")}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("signup.passwordHint")}
                  className="pl-9"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-brand w-full text-white transition-transform hover:scale-[1.01] hover:opacity-95 active:scale-[0.99]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("signup.createOrg")}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("signup.alreadyHave")}{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
              {t("signup.signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
