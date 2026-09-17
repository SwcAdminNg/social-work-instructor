"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ExternalLink, Globe, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/generic/ThemeProvider";
import { dashboardNavGroups, type NavItem } from "./nav-items";
import { useSidebar } from "./SidebarContext";
import { IconChevronsLeft, IconClose } from "./icons";
import { LogoutButton } from "./LogoutButton";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen, collapsed, toggleCollapsed } =
    useSidebar();
  const compact = collapsed ? "lg:hidden" : "";

  function NavLink({ item }: { item: NavItem }) {
    const Icon = item.icon;
    const active = !item.disabled && isActive(pathname, item.href);
    const commonClass = `group relative flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium no-underline transition-all duration-150 ${
      active
        ? "bg-[#2D6A4F] text-white shadow-[0_10px_24px_-16px_rgba(45,106,79,0.85)] dark:bg-[#52b788] dark:text-[#06130d]"
        : item.disabled
          ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
          : "text-slate-700 hover:bg-[#eef8f2] hover:text-[#2D6A4F] dark:text-slate-300 dark:hover:bg-[#52b788]/12 dark:hover:text-[#b7e4c7]"
    } ${collapsed ? "lg:justify-center lg:px-0" : ""}`;

    const content = (
      <>
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        </span>
        <span className={`min-w-0 truncate ${compact}`}>{item.label}</span>
        {item.href.startsWith("/") &&
          !item.href.startsWith("/dashboard") &&
          !item.disabled && (
            <ExternalLink
              className={`ml-auto h-3.5 w-3.5 opacity-45 ${compact}`}
              aria-hidden="true"
            />
          )}
      </>
    );

    if (item.disabled) {
      return (
        <button
          type="button"
          disabled
          title={collapsed ? `${item.label} (coming soon)` : undefined}
          className={commonClass}
          aria-label={`${item.label} coming soon`}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={commonClass}
      >
        {content}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#e5e3ee] bg-white shadow-[16px_0_40px_-38px_rgba(18,24,40,0.45)] transition-all duration-300 ease-in-out dark:border-[#262a3d] dark:bg-[#111525] dark:shadow-none
          ${collapsed ? "lg:w-[78px]" : "lg:w-[252px]"}
          w-[252px]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-24 flex-shrink-0 items-center justify-between gap-2 px-4">
          <Link
            href="/dashboard"
            className={`flex min-w-0 items-center overflow-hidden no-underline ${collapsed ? "lg:hidden" : ""}`}
            aria-label="Social Work Nigeria dashboard home"
          >
            <div
              className={`relative h-24 overflow-hidden transition-all duration-300 ${
                collapsed ? "lg:w-[50px]" : "w-[220px]"
              }`}
            >
              <Image
                src="/images/logo/swc-dark-logo.png"
                alt="SWC Logo"
                width={220}
                height={96}
                priority
                className={`h-24 w-[220px] max-w-none object-contain object-left scale-125 origin-left ${
                  collapsed
                    ? "lg:w-[220px] scale-100 lg:scale-125 origin-center lg:origin-left"
                    : ""
                }`}
              />
            </div>
          </Link>

          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:flex ${collapsed ? "lg:hidden" : ""}`}
          >
            <IconChevronsLeft />
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          >
            <IconClose />
          </button>
        </div>

        {/* Nav items */}
        <nav className="swcl-sidebar-scroll flex-1 overflow-y-auto px-3 pb-4">
          <div className="flex flex-col gap-4">
            {dashboardNavGroups.map((group, index) => (
              <section key={group.label ?? `primary-${index}`}>
                {group.label && (
                  <p
                    className={`mb-2 px-2 text-[0.68rem] font-semibold uppercase tracking-[0.05em] text-slate-500 dark:text-slate-500 ${compact}`}
                  >
                    {group.label}
                  </p>
                )}
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <NavLink item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`mx-3 mb-2 hidden h-9 items-center justify-center gap-2 rounded-md px-3 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:flex ${collapsed ? "" : "lg:hidden"}`}
        >
          <span
            className={`flex-shrink-0 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          >
            <IconChevronsLeft />
          </span>
          <span className={collapsed ? "hidden" : ""}>Collapse</span>
        </button>

        {/* Back to Website & Logout */}
        <div className="flex-shrink-0 space-y-1 border-t border-[#eceaf4] px-3 pb-4 pt-3 dark:border-[#262a3d]">
          <Link
            href="/"
            title={collapsed ? "Back to Website" : undefined}
            className={`group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 no-underline transition-colors duration-150 hover:bg-[#eef8f2] hover:text-[#2D6A4F] dark:text-slate-300 dark:hover:bg-[#52b788]/12 dark:hover:text-[#b7e4c7] ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
          >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <Globe className="w-[18px] h-[18px]" />
            </span>
            <span className={`whitespace-nowrap ${compact}`}>
              Back to Website
            </span>
          </Link>
          <LogoutButton isSidebar collapsed={collapsed} />
          <SidebarThemeToggle collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}

function SidebarThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const compact = collapsed ? "lg:hidden" : "";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={collapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
      className={`mt-3 flex h-10 w-full items-center gap-3 rounded-md border border-[#dceee4] bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:border-[#b7e4c7] hover:bg-[#f7fcf9] dark:border-[#27433a] dark:bg-[#13231d] dark:text-slate-100 dark:hover:border-[#40916c] dark:hover:bg-[#183026] ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#2D6A4F] dark:text-[#52b788]">
        {isDark ? (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.9} />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.9} />
        )}
      </span>
      <span className={`min-w-0 flex-1 text-left ${compact}`}>Dark mode</span>
      <span
        className={`flex h-5 w-9 flex-shrink-0 items-center rounded-full p-0.5 transition-colors ${compact} ${
          isDark
            ? "justify-start bg-[#52b788]"
            : "justify-end bg-slate-200 dark:bg-slate-700"
        }`}
        aria-hidden="true"
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm transition-all" />
      </span>
    </button>
  );
}
