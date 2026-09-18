"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, User, Briefcase, Phone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

type DepartmentOption = { id: string; name: string; color: string };

export function RegisterWorkerForm({
  code,
  organizationName,
  departments,
}: {
  code: string;
  organizationName: string;
  departments: DepartmentOption[];
}) {
  const [form, setForm] = useState({
    name: "",
    departmentId: departments[0]?.id ?? "",
    designation: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.pin !== form.confirmPin) {
      toast.error("PINs don't match");
      return;
    }
    if (!/^\d{4,6}$/.test(form.pin)) {
      toast.error("PIN must be 4 to 6 digits");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/public/join/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          departmentId: form.departmentId,
          designation: form.designation,
          phone: form.phone,
          pin: form.pin,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card shadow-glow border-none py-0 shadow-xl">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_oklab,#0ca30c_15%,transparent)] text-[#0ca30c]">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h2 className="font-heading text-xl font-bold">Registration submitted</h2>
            <p className="text-sm text-muted-foreground">
              Thanks, <span className="font-medium text-foreground">{form.name}</span>! Your
              registration to <span className="font-medium text-foreground">{organizationName}</span>{" "}
              is waiting for admin approval. Once approved, sign in with your phone number and PIN.
            </p>
            <Link
              href={`/join/${code}/login`}
              className="mt-2 text-sm font-medium text-foreground underline underline-offset-2"
            >
              Go to worker sign-in
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (departments.length === 0) {
    return (
      <Card className="glass-card shadow-glow border-none py-0 shadow-xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {organizationName} hasn&apos;t set up any departments yet. Please check back later.
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="glass-card shadow-glow border-none py-0 shadow-xl">
        <CardHeader className="pt-8">
          <CardTitle className="font-heading text-2xl">Join {organizationName}</CardTitle>
          <CardDescription>Register yourself as a worker — an admin will review and approve you.</CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="e.g. Ravi Sharma"
                  className="pl-9"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}
              >
                <SelectTrigger id="department" className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Role / designation (optional)</Label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="designation"
                  placeholder="e.g. Machine Operator"
                  className="pl-9"
                  value={form.designation}
                  onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="9876543210"
                  className="pl-9"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You&apos;ll use this to sign in once you&apos;re approved.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Create a PIN</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="4-6 digits"
                    className="pl-9"
                    value={form.pin}
                    onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))}
                    minLength={4}
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPin">Confirm PIN</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    placeholder="4-6 digits"
                    className="pl-9"
                    value={form.confirmPin}
                    onChange={(e) => setForm((f) => ({ ...f, confirmPin: e.target.value.replace(/\D/g, "") }))}
                    minLength={4}
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !form.departmentId}
              className="bg-gradient-brand w-full text-white hover:opacity-95"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit registration
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already registered and approved?{" "}
            <Link href={`/join/${code}/login`} className="font-medium text-foreground underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
