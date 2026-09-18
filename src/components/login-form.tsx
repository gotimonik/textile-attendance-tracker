"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader2, Lock, Shirt, User } from "lucide-react";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("admin-login", {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid username or password");
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");
      router.push(callbackUrl);
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
          <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to manage today&apos;s attendance</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="admin"
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            Default demo login: <span className="font-medium text-foreground">admin</span> /{" "}
            <span className="font-medium text-foreground">admin123</span>
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            New unit?{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-2">
              Create a workspace
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
