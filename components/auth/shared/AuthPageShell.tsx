import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HydrationGate from "@/components/site/HydrationGate";
import { BrandPanel, MobileBrandLogo } from "./BrandPanel";

type AuthVariant = "login" | "register" | "forgot-password" | "reset-password";
type HomeStats = { total_number_of_students?: number; number_of_published_courses?: number } | null;

export function AuthPageShell({
  children,
  variant = "login",
  statsData,
}: {
  children: React.ReactNode;
  variant?: AuthVariant;
  statsData?: HomeStats;
}) {
  return (
    <HydrationGate className="flex min-h-[100dvh] bg-paper">
      <BrandPanel variant={variant} statsData={statsData} />

      <main className="relative flex flex-1 flex-col">
        <div className="flex justify-end px-5 pt-5 sm:px-8">
          <Link
            href="/"
            className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-full border border-line px-4 text-sm font-semibold text-ink no-underline transition-colors duration-300 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink"
          >
            <ArrowLeft size={16} aria-hidden="true" className="transition-transform duration-500 ease-sw group-hover:-translate-x-1" />
            Back to website
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-6 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[460px]" data-reveal style={{ ["--d" as string]: "0.35s" }}>
            <MobileBrandLogo />
            {children}
          </div>
        </div>
      </main>
    </HydrationGate>
  );
}
