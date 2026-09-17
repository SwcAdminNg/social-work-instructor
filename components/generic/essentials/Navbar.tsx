"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  isLoggedIn?: boolean;
}

export default function Navbar({ isLoggedIn = false }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/55 dark:bg-gray-900/55 backdrop-blur-xl backdrop-saturate-150 border-b border-white/30 dark:border-gray-700/40 shadow-[0_1px_20px_-4px_rgba(0,0,0,0.08)]">
      <div
        className="max-w-6xl mx-auto px-6 flex items-center gap-6"
        style={{ height: "84px" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center flex-shrink-0 no-underline"
          aria-label="Social Work Consultancy Home"
        >
          <img
            src="/images/logo/swc-dark-logo.png"
            alt="SWC Logo"
            width={151}
            height={40}
            className="w-[170px] md:w-[180px] h-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-1 list-none m-0 p-0 flex-1 justify-center">
          {[
            { name: "About Us", href: "/about-us" },
            { name: "Contact Us", href: "/contact" },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`relative flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors no-underline whitespace-nowrap group hover:bg-white/60 dark:hover:bg-gray-800/60 ${
                    isActive
                      ? "text-[#2D6A4F] dark:text-[#52b788]"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {item.name}
                  {/* Modern Animated Underline */}
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-[#2D6A4F] dark:bg-[#52b788] transition-all duration-300 ${
                      isActive
                        ? "w-[60%] opacity-100"
                        : "w-0 opacity-0 group-hover:w-[30%] group-hover:opacity-40"
                    }`}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Login/Dashboard — desktop */}
        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="hidden lg:inline-flex items-center justify-center px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 relative group no-underline overflow-hidden flex-shrink-0 tracking-wide"
          >
            <span className="relative z-10 group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788] transition-colors duration-300">
              Dashboard
            </span>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2D6A4F] dark:bg-[#52b788] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="hidden lg:inline-flex items-center justify-center px-2 py-2 text-sm font-bold text-gray-800 dark:text-gray-200 relative group no-underline overflow-hidden flex-shrink-0 tracking-wide"
          >
            <span className="relative z-10 group-hover:text-[#2D6A4F] dark:group-hover:text-[#52b788] transition-colors duration-300">
              Login
            </span>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2D6A4F] dark:bg-[#52b788] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
          </Link>
        )}

        {/* Hamburger — mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu-panel"
          className="lg:hidden ml-auto flex flex-col justify-center gap-[5px] w-10 h-10 bg-transparent hover:bg-white/60 dark:hover:bg-gray-800/60 border-0 cursor-pointer p-1 rounded-full transition-colors"
        >
          <span
            className={`block w-[22px] h-[2px] bg-gray-800 dark:bg-gray-200 rounded transition-transform duration-200 origin-center ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`}
          />
          <span
            className={`block w-[22px] h-[2px] bg-gray-800 dark:bg-gray-200 rounded transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-[22px] h-[2px] bg-gray-800 dark:bg-gray-200 rounded transition-transform duration-200 origin-center ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu-panel"
        className={`lg:hidden absolute top-[84px] left-0 right-0 h-[calc(100dvh-84px)] overflow-y-auto transition-all duration-300 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col ${
          menuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
      >
        <ul className="list-none m-0 px-6 py-6 flex flex-col gap-2">
          {[
            { name: "About Us", href: "/about-us" },
            { name: "Contact Us", href: "/contact" },
          ].map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block py-4 text-xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800/50 no-underline transition-colors active:text-[#2D6A4F] dark:active:text-[#52b788]"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="px-6 pb-12 pt-6 mt-auto">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="block text-center py-4 px-6 text-[#2D6A4F] dark:text-[#52b788] text-lg font-bold tracking-widest border-2 border-[#2D6A4F] dark:border-[#52b788] no-underline hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-[#52b788] dark:hover:text-gray-900 transition-all duration-300 active:scale-95"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="block text-center py-4 px-6 text-[#2D6A4F] dark:text-[#52b788] text-lg font-bold tracking-widest border-2 border-[#2D6A4F] dark:border-[#52b788] no-underline hover:bg-[#2D6A4F] hover:text-white dark:hover:bg-[#52b788] dark:hover:text-gray-900 transition-all duration-300 active:scale-95"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
