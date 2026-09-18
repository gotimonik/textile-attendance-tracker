import {
  LayoutDashboard,
  CalendarCheck2,
  Users,
  Building2,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Today's overview",
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: CalendarCheck2,
    description: "Mark daily attendance",
  },
  {
    href: "/workers",
    label: "Workers",
    icon: Users,
    description: "Manage your workforce",
  },
  {
    href: "/departments",
    label: "Departments",
    icon: Building2,
    description: "Organize by department",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: FileBarChart,
    description: "History & export",
  },
];
