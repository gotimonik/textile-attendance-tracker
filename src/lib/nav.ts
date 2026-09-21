import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Building2,
  FileBarChart,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  // Dictionary keys (under the "nav" namespace) — resolved with useTranslation()
  // at render time in SidebarNav/MobileNav, not literal display text, so the
  // sidebar follows whatever language the signed-in admin has chosen.
  labelKey: string;
  descriptionKey: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    labelKey: "nav.dashboard",
    descriptionKey: "nav.dashboardDesc",
    icon: LayoutDashboard,
  },
  {
    href: "/attendance",
    labelKey: "nav.attendance",
    descriptionKey: "nav.attendanceDesc",
    icon: CalendarCheck2,
  },
  {
    href: "/workers",
    labelKey: "nav.workers",
    descriptionKey: "nav.workersDesc",
    icon: Users,
  },
  {
    href: "/departments",
    labelKey: "nav.departments",
    descriptionKey: "nav.departmentsDesc",
    icon: Building2,
  },
  {
    href: "/reports",
    labelKey: "nav.reports",
    descriptionKey: "nav.reportsDesc",
    icon: FileBarChart,
  },
  {
    href: "/salary",
    labelKey: "nav.salary",
    descriptionKey: "nav.salaryDesc",
    icon: Wallet,
  },
];
