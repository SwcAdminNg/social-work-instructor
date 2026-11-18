"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/components/generic/ThemeProvider";
import { cx } from "./ui";
import Logo from "./Logo";

export const NAV_ITEMS = [
  { name: "Why Teach", href: "/why-teach" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About Us", href: "/about-us" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact Us", href: "/contact" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sticky site header: logo, centred navigation, theme switch and login. */
export default function SiteHeader({ isLoggedIn = false, brand }: { isLoggedIn?: boolean; brand?: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle, setHeaderToggle } = useTheme();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const account = isLoggedIn ? { name: "Dashboard", href: "/dashboard" } : { name: "Login", href: "/login" };
  const isDark = theme === "dark";
  const themeLabel = isDark ? "Switch to light mode" : "Switch to dark mode";

  // The header owns the theme switch, so the floating one stays hidden.
  useEffect(() => {
    setHeaderToggle(true);
    return () => setHeaderToggle(false);
  }, [setHeaderToggle]);

  // Close the menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1001px)");
    const onDesktop = () => desktop.matches && setOpen(false);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-swc-line bg-swc-white/95 backdrop-blur supports-[backdrop-filter]:bg-swc-white/85">
      <div className="swc-wrap flex h-[68px] items-center gap-6">
        <div className="flex min-w-0 flex-1 items-center">{brand ?? <Logo priority />}</div>

        <nav aria-label="Main" className="hidden min-[1001px]:block">
          <ul className="m-0 flex list-none items-center gap-1 p-0">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "relative inline-flex min-h-11 items-center px-3.5 text-[0.9rem] font-medium no-underline transition-colors",
                      active ? "text-swc-ink" : "text-swc-ink-2 hover:text-swc-ink",
                    )}
                  >
                    {item.name}
                    {active && (
                      <span aria-hidden="true" className="absolute inset-x-3.5 bottom-1.5 h-[2px] rounded-full bg-swc-gold" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={themeLabel}
            title={themeLabel}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-swc-ink transition-colors hover:bg-swc-mint"
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
          </button>
          <Link
            href={account.href}
            className="hidden min-h-10 items-center rounded-full bg-swc-deep px-5 text-[0.88rem] font-bold text-white no-underline transition-colors hover:bg-swc-mid min-[701px]:inline-flex"
          >
            {account.name}
          </Link>
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="swc-mobile-menu"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-swc-line bg-swc-card px-3 text-[0.88rem] font-semibold text-swc-ink min-[1001px]:hidden"
          >
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            Menu
          </button>
        </div>
      </div>

      <div
        id="swc-mobile-menu"
        hidden={!open}
        className="border-t border-swc-line bg-swc-white min-[1001px]:hidden"
      >
        <nav aria-label="Mobile" className="swc-wrap py-3">
          <ul className="m-0 list-none p-0">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="border-b border-swc-line last:border-b-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "flex min-h-12 items-center text-base no-underline",
                      active ? "font-bold text-swc-ink" : "font-medium text-swc-ink-2",
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={account.href}
            onClick={() => setOpen(false)}
            className="swc-btn swc-btn--green mt-3 mb-2 w-full"
          >
            {account.name}
          </Link>
        </nav>
      </div>
    </header>
  );
}
