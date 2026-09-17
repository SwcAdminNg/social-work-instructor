"use client";

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

function IconFacebook() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconTwitterX() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const platformLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Community", href: "/dashboard/community" },
  { label: "Profile Settings", href: "/dashboard/settings" },
];

const companyLinks = [
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

const socialLinks = [
  { label: "Facebook", href: "#", icon: <IconFacebook /> },
  { label: "X (Twitter)", href: "#", icon: <IconTwitterX /> },
  { label: "LinkedIn", href: "#", icon: <IconLinkedIn /> },
];

const contactItems = [
  {
    icon: <MapPin className="w-4 h-4" />,
    label: "Address",
    value: "Flat C3, Okonkwo Estate, Jos, Plateau State.",
    href: undefined,
  },
  {
    icon: <Phone className="w-4 h-4" />,
    label: "Phone",
    value: "+2348034471063",
    href: "tel:+2348034471063",
  },
  {
    icon: <Mail className="w-4 h-4" />,
    label: "Email",
    value: "support@socialworknigeria.org",
    href: "mailto:support@socialworknigeria.org",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-6">
      <span
        className="w-4 h-px bg-[#2D6A4F] dark:bg-[#52b788]"
        aria-hidden="true"
      />
      <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#2D6A4F] dark:text-[#52b788]">
        {children}
      </span>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative bg-white dark:bg-[#060f0a] border-t border-gray-100 dark:border-gray-900 overflow-hidden"
      aria-label="Site footer"
    >
      {/* Decorative Blur Blob */}
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#2D6A4F]/5 dark:bg-[#2D6A4F]/10 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* ── Column 1: Brand ── */}
          <div className="flex flex-col gap-6 pr-4">
            <Link
              href="/"
              className="flex items-center gap-3 no-underline w-fit group"
              aria-label="Social Work Nigeria home"
            >
              <img
                src="/images/logo/swc-dark-logo.png"
                alt="SWC Logo"
                width={151}
                height={40}
                className="w-[170px] md:w-[180px] h-auto object-contain"
              />
            </Link>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              Strengthening ethical, skilled, and accountable social work
              practice across Nigeria through structured, practice-led
              instructor collaboration and professional community.
            </p>

            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ label, href, icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-white dark:hover:text-white hover:bg-[#2D6A4F] dark:hover:bg-[#52b788] transition-all duration-300 no-underline"
                >
                  {icon}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Column 2: Platform Links ── */}
          <div>
            <SectionLabel>Platform</SectionLabel>
            <ul className="flex flex-col gap-3" role="list">
              {platformLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Company Links ── */}
          <div>
            <SectionLabel>Company</SectionLabel>
            <ul className="flex flex-col gap-3" role="list">
              {companyLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Contact ── */}
          <div>
            <SectionLabel>Contact</SectionLabel>
            <ul className="flex flex-col gap-5" role="list">
              {contactItems.map(({ icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-3 group">
                  <span className="mt-0.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900 text-[#2D6A4F] dark:text-[#52b788] group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors duration-300">
                    {icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-bold mb-0.5">
                      {label}
                    </span>
                    {href ? (
                      <a
                        href={href}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-200"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {value}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-500 text-center md:text-left">
            © {year} Social Work Consultancy Ltd. All Rights Reserved.
          </p>

          <div className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/privacy-policy"
              className="text-gray-500 dark:text-gray-500 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-gray-500 dark:text-gray-500 hover:text-[#2D6A4F] dark:hover:text-[#52b788] transition-colors duration-200"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
