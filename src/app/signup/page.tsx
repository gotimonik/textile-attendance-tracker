import { Suspense } from "react";
import { SignupForm } from "@/components/signup-form";
import { Shirt, Building2, Users, QrCode } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
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
            One workspace per unit. Zero mix-ups.
          </h1>
          <p className="text-base text-white/85">
            Create your organization, invite your workers with a single link, and keep
            attendance completely separate from every other unit on ThreadTrack.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { icon: Building2, text: "Your own departments, workers and attendance history" },
              { icon: QrCode, text: "A shareable invite link — workers register themselves" },
              { icon: Users, text: "Approve new workers before they're marked present" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/60">
          &copy; {new Date().getFullYear()} ThreadTrack. Built for textile &amp; embroidery units.
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
