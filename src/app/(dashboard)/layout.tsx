import { AppShell } from "@/components/shell/app-shell";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
