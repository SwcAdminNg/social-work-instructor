import type { LucideIcon } from "lucide-react";
import type { AccessCapabilities } from "@/components/dashboard/instructor/types";
import {
  BookOpenCheck,
  ClipboardCheck,
  FileCheck2,
  LayoutDashboard,
  Settings,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  requiredCapability?: keyof AccessCapabilities;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export const dashboardNavGroups: NavGroup[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Course Studio",
        href: "/dashboard/courses",
        icon: BookOpenCheck,
        requiredCapability: "can_edit_content",
      },
      {
        label: "Assessments",
        href: "/dashboard/assessments",
        icon: ClipboardCheck,
        requiredCapability: "can_mark_essays",
      },
      {
        label: "Approval Centre",
        href: "/dashboard/approval-centre",
        icon: FileCheck2,
        requiredCapability: "can_access_approval_centre",
      },
      {
        label: "Community",
        href: "/dashboard/community",
        icon: UsersRound,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Profile Settings",
        href: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];

export const dashboardNavItems = dashboardNavGroups.flatMap(
  (group) => group.items,
);

export function getPageTitle(pathname: string): string {
  const exact = dashboardNavItems.find((item) => item.href === pathname);
  if (exact) return exact.label;

  const nested = dashboardNavItems
    .filter(
      (item) => item.href !== "/dashboard" && pathname.startsWith(item.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return nested?.label ?? "Dashboard";
}
