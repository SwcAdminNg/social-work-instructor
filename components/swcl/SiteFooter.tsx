import Link from "next/link";
import Logo from "./Logo";

const columns = [
  {
    label: "Platform",
    links: [
      { label: "Why Teach", href: "/why-teach" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Express Interest", href: "/register" },
      { label: "Instructor Login", href: "/login" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Contact Us", href: "/contact" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

function ColumnLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-swc-label">
      <span aria-hidden="true" className="h-[2px] w-4 bg-swc-gold" />
      {children}
    </h2>
  );
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-swc-line bg-swc-white">
      <div className="swc-wrap grid gap-10 py-14 min-[701px]:grid-cols-2 min-[1001px]:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div className="flex flex-col gap-5">
        <Logo />
        <p className="m-0 max-w-[330px] text-[0.92rem] leading-relaxed text-swc-ink-2">
          Strengthening ethical, skilled and accountable social work practice across Nigeria through structured,
          practice-led education.
        </p>
        </div>

        {columns.map((col) => (
          <nav key={col.label} aria-label={col.label}>
            <ColumnLabel>{col.label}</ColumnLabel>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[0.92rem] text-swc-ink-2 no-underline hover:text-swc-ink hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <ColumnLabel>Contact</ColumnLabel>
          <address className="flex flex-col gap-2.5 text-[0.92rem] not-italic text-swc-ink-2">
            <span>Flat C3, Okonkwo Estate, Jos, Plateau State.</span>
            <a href="tel:+2348034471063" className="text-swc-ink-2 no-underline hover:text-swc-ink hover:underline">
              +234 803 447 1063
            </a>
            <a
              href="mailto:support@socialworknigeria.org"
              className="break-words text-swc-ink-2 no-underline hover:text-swc-ink hover:underline"
            >
              support@socialworknigeria.org
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-swc-line">
        <div className="swc-wrap flex flex-col gap-3 py-5 text-[0.82rem] text-swc-ink-3 min-[701px]:flex-row min-[701px]:items-center min-[701px]:justify-between">
          <p className="m-0">© {new Date().getFullYear()} Social Work Consultancy Ltd. All Rights Reserved.</p>
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
            <li>
              <Link href="/privacy-policy" className="text-swc-ink-3 no-underline hover:text-swc-ink hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms-of-service" className="text-swc-ink-3 no-underline hover:text-swc-ink hover:underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-swc-ink-3 no-underline hover:text-swc-ink hover:underline">
                Instructor opportunities
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
