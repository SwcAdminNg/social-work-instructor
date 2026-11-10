"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/generic/ThemeProvider";
import { useAdaptiveSurface } from "./useAdaptiveSurface";

interface NavbarProps {
  isLoggedIn?: boolean;
}

const NAV_ITEMS = [
  { name: "Why Teach", href: "/why-teach" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About Us", href: "/about-us" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact Us", href: "/contact" },
];

const HEADER_HEIGHT = 84;

// useLayoutEffect warns during server rendering; fall back to useEffect there.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggle, setHeaderToggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  // Keeps the header above page overlays until the sheet has finished closing.
  const [raised, setRaised] = useState(false);
  if (menuOpen && !raised) setRaised(true);
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  const surface = useAdaptiveSurface(navRef, HEADER_HEIGHT, [pathname, theme]);

  // While the menu is open the header sits on the deep green sheet.
  const onDark = menuOpen || surface.tone === "dark";
  const isDarkTheme = theme === "dark";
  const account = isLoggedIn
    ? { name: "Dashboard", href: "/dashboard" }
    : { name: "Login", href: "/login" };

  // The header owns the theme switch, so the floating one stays hidden.
  useEffect(() => {
    setHeaderToggle(true);
    return () => setHeaderToggle(false);
  }, [setHeaderToggle]);

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  }, []);

  // Close the menu whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  // Hide the header while reading down the page; bring it back on any scroll up.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (Math.abs(delta) < 6) return;
        // Stay put while a keyboard user is focused inside the header.
        const active = document.activeElement;
        const focusInside =
          !!active && !!navRef.current?.contains(active) && active.matches(":focus-visible");
        setHidden(delta > 0 && y > HEADER_HEIGHT * 1.5 && !focusInside);
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Menu open: lock page scroll, trap focus, close on Escape or on desktop widths.
  useIsoLayoutEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => firstMenuLinkRef.current?.focus(), 80);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== "Tab" || !navRef.current) return;
      const focusable = Array.from(
        navRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ).filter((el) => el.offsetParent !== null && !el.closest("[inert]"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && closeMenu();

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      root.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen, closeMenu]);

  const surfaceStyle: React.CSSProperties = menuOpen
    ? { backgroundColor: "transparent", borderColor: "transparent" }
    : {
        backgroundColor: `rgba(${surface.rgb}, ${surface.atTop ? 0 : 0.74})`,
        borderColor: surface.atTop
          ? "transparent"
          : onDark
            ? "rgba(255,255,255,0.12)"
            : "rgba(15,23,20,0.09)",
        boxShadow: surface.atTop
          ? "none"
          : onDark
            ? "0 18px 40px -22px rgba(0,0,0,0.65)"
            : "0 18px 40px -24px rgba(14,31,23,0.35)",
      };

  const fg = onDark ? "text-white" : "text-[#10231a]";
  const fgMuted = onDark
    ? "text-white/75 hover:text-white"
    : "text-[#10231a]/70 hover:text-[#10231a]";
  const hoverWash = onDark ? "hover:bg-white/10" : "hover:bg-black/[0.05]";
  const accent = onDark ? "bg-[#F3C56B]" : "bg-[#2D6A4F]";

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      data-site-header
      data-ready={surface.ready || undefined}
      className={`sticky top-0 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
        raised ? "z-[1000]" : "z-50"
      } ${hidden && !menuOpen ? "-translate-y-full" : ""}`}
    >
      {/* No transform on the nav while open: it would trap the fixed sheet. */}
      {/* Adaptive capsule: takes on the colour of whatever is beneath it. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2.5 top-2.5 bottom-2.5 -z-10 sm:inset-x-5">
        <div
          className={`mx-auto h-full max-w-[1280px] rounded-full border motion-reduce:transition-none ${
            surface.atTop || menuOpen ? "" : "backdrop-blur-2xl backdrop-saturate-[1.8]"
          } ${surface.ready ? "transition-[background-color,border-color,box-shadow] duration-500 ease-out" : ""}`}
          style={surfaceStyle}
        />
      </div>

      <div
        className="relative z-10 mx-auto flex max-w-[1280px] items-center gap-6 px-7 sm:px-12"
        style={{ height: HEADER_HEIGHT }}
      >
        <Link
          href="/"
          className="group relative flex flex-col flex-shrink-0 no-underline rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          aria-label="SWCL Instructor Platform, Social Work Consultancy home"
        >
          <span className="relative block">
          {/* Both marks are stacked so the swap is a cross-fade, not a flash. */}
          <Image
            src="/images/logo/swc-logo-on-light.webp"
            alt=""
            width={480}
            height={133}
            sizes="160px"
            priority
            className={`w-[138px] md:w-[156px] h-auto object-contain transition-opacity duration-500 ${onDark ? "opacity-0" : "opacity-100"}`}
          />
          <Image
            src="/images/logo/swc-logo-on-dark.webp"
            alt=""
            width={480}
            height={133}
            sizes="160px"
            priority
            className={`absolute inset-0 w-[138px] md:w-[156px] h-auto object-contain transition-opacity duration-500 ${onDark ? "opacity-100" : "opacity-0"}`}
          />
          </span>
          {/* Sub-brand line, spanning the width of the logo. */}
          <span
            aria-hidden="true"
            className="mt-[3px] flex items-center gap-[5px] md:gap-[7px] text-[9px] md:text-[10px] font-semibold uppercase leading-none tracking-[0.12em] whitespace-nowrap"
          >
            <span
              className={`h-px w-2 md:w-3.5 rounded-full transition-[background-color,width] duration-500 group-hover:w-3 md:group-hover:w-5 ${
                onDark ? "bg-[#F3C56B]" : "bg-[#EBA937]"
              }`}
            />
            <span
              className={`transition-colors duration-500 ${onDark ? "text-[#F3C56B]" : "text-[#2D6A4F]"}`}
            >
              Instructor Platform
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden lg:flex items-center gap-1 list-none m-0 p-0 flex-1 justify-center">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center px-4 py-2 text-sm font-medium rounded-full no-underline whitespace-nowrap transition-colors duration-300 ${hoverWash} ${
                    active ? fg : fgMuted
                  }`}
                >
                  {item.name}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-[3px] left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${accent} ${
                      active ? "w-5 opacity-100" : "w-0 opacity-0 group-hover:w-3 group-hover:opacity-60"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto lg:ml-0 flex items-center gap-1.5">
          <ThemeSwitch
            isDark={isDarkTheme}
            onToggle={toggle}
            className={`hidden lg:inline-flex ${fg} ${hoverWash}`}
          />

          <Link
            href={account.href}
            className={`group hidden lg:inline-flex items-center gap-2.5 h-10 pl-5 pr-1.5 ml-1 rounded-full text-sm font-semibold no-underline transition-all duration-300 active:scale-[0.97] ${
              onDark
                ? "bg-white text-[#0c2a1e] hover:bg-[#F3C56B]"
                : "bg-[#14402F] text-white hover:bg-[#2D6A4F]"
            }`}
          >
            {account.name}
            <span
              aria-hidden="true"
              className={`grid h-7 w-7 place-items-center rounded-full transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-rotate-45 ${
                onDark ? "bg-[#0c2a1e] text-[#F3C56B]" : "bg-[#EBA937] text-[#10231a]"
              }`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>

          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu-panel"
            className={`lg:hidden relative grid place-items-center w-11 h-11 -mr-1.5 rounded-full cursor-pointer border-0 bg-transparent transition-colors duration-300 ${fg} ${hoverWash} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current`}
          >
            <span aria-hidden="true" className="relative block w-[22px] h-[14px]">
              <span
                className={`absolute left-0 h-[2px] rounded-full bg-current transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                  menuOpen ? "top-[6px] w-[22px] rotate-45" : "top-[2px] w-[22px]"
                }`}
              />
              <span
                className={`absolute right-0 h-[2px] rounded-full bg-current transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                  menuOpen ? "top-[6px] w-[22px] -rotate-45" : "top-[10px] w-[14px]"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <MobileMenu
        open={menuOpen}
        pathname={pathname}
        account={account}
        isDark={isDarkTheme}
        onToggleTheme={toggle}
        onNavigate={() => closeMenu()}
        onClosed={() => setRaised(false)}
        firstLinkRef={firstMenuLinkRef}
      />
    </nav>
  );
}

function ThemeSwitch({
  isDark,
  onToggle,
  className = "",
}: {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={`relative items-center justify-center w-10 h-10 rounded-full border-0 bg-transparent cursor-pointer transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${className}`}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`absolute transition-all duration-500 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`absolute transition-all duration-500 ${isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}

function MobileMenu({
  open,
  pathname,
  account,
  isDark,
  onToggleTheme,
  onNavigate,
  onClosed,
  firstLinkRef,
}: {
  open: boolean;
  pathname: string;
  account: { name: string; href: string };
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate: () => void;
  onClosed: () => void;
  firstLinkRef: React.RefObject<HTMLAnchorElement | null>;
}) {
  // Items cascade in after the sheet starts to open, and leave together.
  const stagger = (index: number): React.CSSProperties => ({
    transitionDelay: open ? `${160 + index * 55}ms` : "0ms",
  });
  const rise = `transition-[opacity,transform] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
    open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
  }`;

  return (
    <div
      id="mobile-menu-panel"
      aria-hidden={!open}
      inert={!open ? true : undefined}
      className={`swcl-menu-sheet lg:hidden fixed inset-0 -z-20 flex flex-col overflow-y-auto overscroll-contain text-white ${
        open ? "is-open" : "pointer-events-none"
      }`}
      style={{ paddingTop: HEADER_HEIGHT }}
      onTransitionEnd={(event) => {
        if (!open && event.target === event.currentTarget) onClosed();
      }}
    >
      <div className="relative flex flex-1 flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-10">
        <p
          className={`m-0 mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F3C56B]/90 ${rise}`}
          style={stagger(0)}
        >
          Explore
        </p>

        <ul className="m-0 list-none p-0">
          {NAV_ITEMS.map((item, index) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href} className={rise} style={stagger(index + 1)}>
                <Link
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-center gap-4 border-b border-white/[0.08] py-[18px] no-underline outline-none focus-visible:bg-white/[0.06] rounded-lg -mx-2 px-2"
                >
                  <span
                    className={`w-7 text-xs font-medium tabular-nums transition-colors ${
                      active ? "text-[#F3C56B]" : "text-white/35 group-hover:text-white/60"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`flex-1 font-display text-[30px] font-semibold leading-none tracking-[-0.03em] transition-[color,transform] duration-300 group-hover:translate-x-1 sm:text-[34px] ${
                      active ? "text-white" : "text-white/85 group-hover:text-white"
                    }`}
                  >
                    {item.name}
                  </span>
                  {active ? (
                    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F3C56B]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F3C56B]" />
                      Here
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-300 group-hover:border-[#F3C56B] group-hover:bg-[#F3C56B] group-hover:text-[#0c2a1e]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7M8 7h9v9" />
                      </svg>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto pt-10">
          <div className={rise} style={stagger(NAV_ITEMS.length + 1)}>
            <Link
              href={account.href}
              onClick={onNavigate}
              className="group flex h-14 items-center justify-between rounded-full bg-[#F3C56B] pl-7 pr-2 text-base font-semibold text-[#0c2a1e] no-underline transition-transform duration-300 active:scale-[0.98]"
            >
              {account.name}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0c2a1e] text-[#F3C56B] transition-transform duration-300 group-hover:translate-x-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          </div>

          <div
            className={`mt-6 flex items-center justify-between gap-4 ${rise}`}
            style={stagger(NAV_ITEMS.length + 2)}
          >
            <div className="min-w-0 text-[13px] leading-relaxed text-white/55">
              <a href="mailto:support@socialworknigeria.org" className="block truncate text-white/80 no-underline hover:text-white">
                support@socialworknigeria.org
              </a>
              <a href="tel:+2348034471063" className="block text-white/55 no-underline hover:text-white">
                +234 803 447 1063
              </a>
            </div>

            {/* Appearance: a two-way segmented switch */}
            <div
              role="group"
              aria-label="Appearance"
              className="relative flex shrink-0 rounded-full bg-white/[0.07] p-1 ring-1 ring-inset ring-white/10"
            >
              <span
                aria-hidden="true"
                className={`absolute top-1 bottom-1 left-1 w-10 rounded-full bg-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
                  isDark ? "translate-x-10" : "translate-x-0"
                }`}
              />
              <button
                type="button"
                onClick={() => isDark && onToggleTheme()}
                aria-pressed={!isDark}
                aria-label="Light mode"
                className={`relative grid h-8 w-10 place-items-center rounded-full border-0 bg-transparent cursor-pointer transition-colors ${!isDark ? "text-[#0c2a1e]" : "text-white/60"}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => !isDark && onToggleTheme()}
                aria-pressed={isDark}
                aria-label="Dark mode"
                className={`relative grid h-8 w-10 place-items-center rounded-full border-0 bg-transparent cursor-pointer transition-colors ${isDark ? "text-[#0c2a1e]" : "text-white/60"}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
