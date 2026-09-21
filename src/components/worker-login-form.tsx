"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, Lock, Phone } from "lucide-react";
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

export function WorkerLoginForm({ code, organizationName }: { code: string; organizationName: string }) {
  const { t } = useTranslation();
  const ERROR_MESSAGES: Record<string, string> = {
    CredentialsSignin: t("join.errCredentials"),
    PENDING_APPROVAL: t("join.errPendingApproval"),
    REJECTED: t("join.errRejected"),
    INACTIVE: t("join.errInactive"),
    ORG_NOT_FOUND: t("join.errOrgNotFound"),
  };
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("worker-login", {
        code,
        phone,
        pin,
        redirect: false,
      });

      if (res?.error) {
        toast.error(ERROR_MESSAGES[res.error] ?? t("join.errGeneric"));
        setLoading(false);
        return;
      }

      toast.success(t("auth.welcomeBack"));
      router.push("/worker");
      router.refresh();
    } catch {
      toast.error(t("join.errGeneric"));
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="glass-card shadow-glow border-none py-0 shadow-xl">
        <CardHeader className="pt-8">
          <CardTitle className="font-heading text-2xl">{t("join.workerSignInTitle")}</CardTitle>
          <CardDescription>{t("join.signInSubtitle", { org: organizationName })}</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("join.phoneNumber")}</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  autoComplete="tel"
                  placeholder="9876543210"
                  className="pl-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">{t("join.pin")}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="••••"
                  className="pl-9"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  minLength={4}
                  maxLength={6}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-brand w-full text-white transition-transform hover:scale-[1.01] hover:opacity-95 active:scale-[0.99]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.signIn")}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("join.notRegistered")}{" "}
            <Link href={`/join/${code}`} className="font-medium text-foreground underline underline-offset-2">
              {t("join.registerHere")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
