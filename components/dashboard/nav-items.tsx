import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Settings,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
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
