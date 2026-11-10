import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Btn, Contours, Heading } from "@/components/site/ui";

function IconFacebook() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconTwitterX() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const platformLinks = [
  { label: "Why Teach", href: "/why-teach" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Apply to Teach", href: "/register" },
  { label: "Instructor Sign In", href: "/login" },
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
  { icon: MapPin, label: "Address", value: "Flat C3, Okonkwo Estate, Jos, Plateau State.", href: undefined },
  { icon: Phone, label: "Phone", value: "+234 803 447 1063", href: "tel:+2348034471063" },
  { icon: Mail, label: "Email", value: "support@socialworknigeria.org", href: "mailto:support@socialworknigeria.org" },
];

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="sw-cap m-0 mb-5 text-gold-light">{children}</h2>;
}

const linkClass =
  "group inline-flex items-center gap-2 text-[0.98rem] text-white/75 no-underline transition-colors duration-300 hover:text-white";

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={linkClass}>
      <span
        aria-hidden="true"
        className="h-px w-0 bg-gold transition-[width] duration-500 ease-sw group-hover:w-4"
      />
      {label}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-paper px-2.5 pb-2.5 sm:px-5 sm:pb-5" aria-label="Site footer">
      <div
        className="sw-on-dark sw-grain relative overflow-hidden rounded-[32px] bg-forest md:rounded-[48px]"
        data-progress="view"
        data-nav-bg="#0c2a1e"
      >
        <Contours className="text-leaf" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-clay/20 blur-[140px]"
        />

        <div className="sw-wrap relative pb-10 pt-16 md:pt-24">
          {/* Closing statement */}
          <div className="flex flex-col gap-10 border-b border-white/10 pb-14 md:pb-20 lg:flex-row lg:items-end lg:justify-between">
            <Heading
              as="p"
              text="Teach what you know from *practice.*"
              accent="text-gold-light"
              className="sw-display m-0 max-w-[13ch] text-[clamp(2.5rem,6.4vw,5.25rem)]"
            />
            <div className="flex max-w-md flex-col gap-6" data-reveal>
              <p className="sw-lead m-0 text-white/70">
                Share your experience with social workers across Nigeria. Build a course, have it reviewed
                and teach it on the Social Work Nigeria learning platform.
              </p>
              <div className="flex flex-wrap gap-3">
                <Btn href="/register" variant="gold">Apply to Teach</Btn>
                <Btn href="/contact" variant="ghost">Contact Us</Btn>
              </div>
            </div>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-14 md:py-16 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.3fr]">
            <div className="col-span-2 flex flex-col gap-6 lg:col-span-1" data-reveal>
              <Link href="/" className="w-fit rounded-md no-underline" aria-label="Social Work Nigeria home">
                <Image
                  src="/images/logo/swc-logo-on-dark.webp"
                  alt="Social Work Consultancy Ltd"
                  width={480}
                  height={133}
                  sizes="180px"
                  className="h-auto w-[164px] object-contain md:w-[180px]"
                />
              </Link>
              <p className="m-0 max-w-xs text-sm leading-relaxed text-white/60">
                The instructor platform of Social Work Consultancy Ltd, where courses for Socialworknigeria.org are built and taught.
              </p>
              <ul className="m-0 flex list-none items-center gap-2.5 p-0">
                {socialLinks.map(({ label, href, icon }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      aria-label={label}
                      className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/75 no-underline transition-all duration-500 ease-sw hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-[#10231a]"
                    >
                      {icon}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <nav aria-label="Platform" data-reveal style={{ "--d": "0.08s" } as React.CSSProperties}>
              <ColumnLabel>Platform</ColumnLabel>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {platformLinks.map((link) => (
                  <li key={link.href}><FooterLink {...link} /></li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Company" data-reveal style={{ "--d": "0.16s" } as React.CSSProperties}>
              <ColumnLabel>Company</ColumnLabel>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {companyLinks.map((link) => (
                  <li key={link.href}><FooterLink {...link} /></li>
                ))}
              </ul>
            </nav>

            <div className="col-span-2 lg:col-span-1" data-reveal style={{ "--d": "0.24s" } as React.CSSProperties}>
              <ColumnLabel>Contact</ColumnLabel>
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {contactItems.map(({ icon: Icon, label, value, href }) => (
                  <li key={label} className="flex items-start gap-3.5">
                    <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-full bg-white/[0.07] text-gold-light">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="sw-cap mb-1 text-white/45">{label}</span>
                      {href ? (
                        <a href={href} className="break-words text-[0.98rem] text-white/85 no-underline transition-colors hover:text-gold-light">
                          {value}
                        </a>
                      ) : (
                        <span className="text-[0.98rem] text-white/85">{value}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 text-sm text-white/55 md:flex-row md:items-center">
            <p className="m-0">© {year} Social Work Consultancy Ltd. All Rights Reserved.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link href="/privacy-policy" className="text-white/55 no-underline transition-colors hover:text-white">Privacy Policy</Link>
              <Link href="/terms-of-service" className="text-white/55 no-underline transition-colors hover:text-white">Terms of Service</Link>
              <Link href="/about-us#photo-credits" className="text-white/55 no-underline transition-colors hover:text-white">Photo credits</Link>
            </div>
          </div>
        </div>

        {/* Oversized wordmark, cropped by the card's edge */}
        <p
          aria-hidden="true"
          className="sw-display pointer-events-none relative m-0 -mb-[0.2em] select-none whitespace-nowrap text-center text-[clamp(3.4rem,15.5vw,15rem)] leading-[0.82] text-white/[0.06]"
        >
          Teach with <span className="sw-em text-gold/30">us</span>
        </p>
      </div>
    </footer>
  );
}
