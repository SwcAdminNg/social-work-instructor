import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandPanel, panelFor, type AuthVariant, type HomeStats } from "./BrandPanel";

const backLink =
  "inline-flex min-h-[44px] items-center gap-2 rounded text-[0.92rem] font-semibold no-underline hover:underline hover:underline-offset-4";

/**
 * Sign-in page frame: a deep green panel beside the form on wide screens; on
 * phones and tablets a compact green band sits above the form.
 */
export function AuthPageShell({
  children,
  variant = "login",
  statsData,
}: {
  children: React.ReactNode;
  variant?: AuthVariant;
  statsData?: HomeStats;
}) {
  const panel = panelFor(variant);
  return (
    <div className="swc grid min-h-[100dvh] bg-swc-paper min-[1001px]:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
      <BrandPanel variant={variant} statsData={statsData} />

      <div className="flex min-w-0 flex-col">
        {/* Compact band on narrow screens. */}
        <div className="swc-dark bg-swc-hero text-white min-[1001px]:hidden">
          <div className="mx-auto w-full max-w-[560px] px-5 pb-7 pt-4 min-[701px]:px-[26px]">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-block rounded">
                <Image
                  src="/images/logo/swc-logo-on-dark.webp"
                  alt="Social Work Consultancy Ltd"
                  width={480}
                  height={133}
                  priority
                  className="h-auto w-[150px]"
                />
              </Link>
              <Link href="/" className={`${backLink} text-white`}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Back to site
              </Link>
            </div>
            <p className="swc-eyebrow mt-5">{panel.eyebrow}</p>
            <p className="mt-2 text-[1.35rem] font-bold leading-[1.2] tracking-[-0.01em] text-white">{panel.title}</p>
          </div>
        </div>

        {/* Top bar on wide screens. */}
        <div className="hidden justify-end px-10 pt-6 min-[1001px]:flex">
          <Link href="/" className={`${backLink} text-swc-ink`}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to site
          </Link>
        </div>

        <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-8 min-[701px]:px-[26px] min-[1001px]:items-center min-[1001px]:px-10 min-[1001px]:pt-6">
          <div className="swc-card w-full max-w-[520px] p-6 min-[701px]:p-9">{children}</div>
        </main>
      </div>
    </div>
  );
}
