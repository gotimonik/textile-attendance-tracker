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

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect phone number or PIN.",
  PENDING_APPROVAL: "Your registration is still waiting for admin approval.",
  REJECTED: "Your registration wasn't approved. Please contact your admin.",
  INACTIVE: "Your account is inactive. Please contact your admin.",
  ORG_NOT_FOUND: "This invite link is invalid or has expired.",
};

export function WorkerLoginForm({ code, organizationName }: { code: string; organizationName: string }) {
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
        toast.error(ERROR_MESSAGES[res.error] ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");
      router.push("/worker");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
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
          <CardTitle className="font-heading text-2xl">Worker sign-in</CardTitle>
          <CardDescription>Sign in to {organizationName} with your phone number and PIN</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
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
              <Label htmlFor="pin">PIN</Label>
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Not registered yet?{" "}
            <Link href={`/join/${code}`} className="font-medium text-foreground underline underline-offset-2">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
