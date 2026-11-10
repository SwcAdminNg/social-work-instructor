import Image from "next/image";
import Link from "next/link";
import { Btn, Contours, Marquee } from "@/components/site/ui";
import { siteFonts } from "@/lib/fonts";

const LINKS = [
  { label: "Why Teach", href: "/why-teach" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact Us", href: "/contact" },
];

export default function NotFound() {
  return (
    <div className={`${siteFonts} sw`}>
      <main className="sw-on-dark sw-grain relative flex min-h-[100dvh] flex-col overflow-hidden bg-forest">
        <Contours className="text-leaf" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-24 h-[420px] w-[420px] rounded-full bg-clay/30 blur-[140px]" />

        <header className="sw-wrap relative flex items-center justify-between py-6">
          <Link href="/" className="rounded-md" aria-label="Social Work Consultancy Ltd home">
            <Image src="/images/logo/swc-logo-on-dark.webp" alt="" width={480} height={133} className="h-auto w-[156px]" priority />
          </Link>
          <span className="sw-cap text-white/60">Error 404</span>
        </header>

        <div className="sw-wrap relative flex flex-1 flex-col justify-center py-10">
          <p aria-hidden="true" className="sw-em m-0 text-[clamp(7rem,26vw,20rem)] leading-[0.78] text-gold-light">
            404
          </p>
          <h1 className="sw-display m-0 mt-6 max-w-3xl text-[clamp(2.1rem,5vw,4.2rem)] text-[#fffdf4]">
            Looks like you&apos;ve wandered off the <em className="sw-em text-gold-light">path.</em>
          </h1>
          <p className="sw-lead m-0 mt-6 max-w-xl text-white/75">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to
            your teaching.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Btn href="/" variant="gold">Return Home</Btn>
            <Btn href="/dashboard" variant="ghost">Instructor Dashboard</Btn>
          </div>
          <nav aria-label="Popular pages" className="mt-12">
            <ul className="m-0 flex list-none flex-wrap gap-x-7 gap-y-3 p-0">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="sw-link text-white/80 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Marquee className="relative pb-8 text-white/[0.09]" duration={40} gap="2rem">
          {["Ethics", "Safeguarding", "Reflection", "Human rights", "Social justice", "Communities"].map((word) => (
            <span key={word} className="sw-display whitespace-nowrap text-[clamp(2.4rem,6vw,5rem)] leading-none">
              {word}
            </span>
          ))}
        </Marquee>
      </main>
    </div>
  );
}
