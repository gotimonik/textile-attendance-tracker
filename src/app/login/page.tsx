import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { Shirt, Sparkles, Scissors, Palette } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />

      {/* Left brand / hero panel */}
      <div className="relative hidden flex-1 flex-col justify-between p-12 text-white lg:flex">
        <div className="absolute inset-0 -z-10 bg-gradient-brand" />
        <div className="absolute inset-0 -z-10 bg-black/10" />

        <div className="flex items-center gap-2 text-lg font-heading font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Shirt className="h-5 w-5" />
          </span>
          ThreadTrack
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight">
            Attendance, tailored for the shop floor.
          </h1>
          <p className="text-base text-white/85">
            Track every embroidery, cutting, stitching and finishing worker&mdash;by
            department, by day&mdash;without the paper registers.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {[
              { icon: Scissors, label: "Cutting" },
              { icon: Sparkles, label: "Embroidery" },
              { icon: Palette, label: "Dyeing" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/60">
          &copy; {new Date().getFullYear()} ThreadTrack. Built for textile &amp; embroidery units.
        </p>
      </div>

      {/* Right login form panel */}
      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
