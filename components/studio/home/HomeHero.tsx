"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Inbox, Plus } from "lucide-react";

const noop = () => () => {};

function useClientNow() {
  // Server renders a neutral greeting; the client fills in the time of day.
  const hour = useSyncExternalStore(noop, () => new Date().getHours(), () => -1);
  const today = useSyncExternalStore(
    noop,
    () => new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
    () => "",
  );
  return { hour, today };
}

function greeting(hour: number) {
  if (hour < 0) return "Welcome back";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeHero({
  firstName,
  summary,
  canCreate,
  showInbox,
  inboxCount,
}: {
  firstName?: string | null;
  summary: React.ReactNode;
  canCreate: boolean;
  showInbox: boolean;
  inboxCount: number;
}) {
  const { hour, today } = useClientNow();
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 py-7 text-white shadow-[0_30px_60px_-40px_rgba(27,67,50,0.9)] sm:px-8 sm:py-9 dark:from-brand-800 dark:via-[#173a2b] dark:to-brand-700 dark:ring-1 dark:ring-brand-400/15">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-28 right-24 h-64 w-64 rounded-full bg-brand-300/25 blur-3xl" />
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="min-h-[1.25rem] text-xs font-bold uppercase tracking-[0.16em] text-brand-100/90">{today}</p>
          <h1 className="mt-2 font-display text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-[2.1rem]">
            {greeting(hour)}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-brand-50/90">{summary}</p>
        </div>
        {(canCreate || showInbox) && (
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            {canCreate && (
              <Link
                href="/dashboard/courses/new"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand-700 no-underline shadow-[0_12px_30px_-14px_rgba(0,0,0,0.45)] transition hover:-translate-y-px hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 dark:bg-brand-300 dark:text-[#06130d] dark:hover:bg-brand-200"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                New course
              </Link>
            )}
            {showInbox && (
              <Link
                href="/dashboard/approval-centre"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/12 px-5 text-sm font-bold text-white no-underline ring-1 ring-inset ring-white/25 backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Inbox className="h-4 w-4" strokeWidth={2} />
                Open inbox
                {inboxCount > 0 && (
                  <span className="min-w-5 rounded-full bg-amber-400 px-1.5 text-center text-[11px] font-extrabold leading-5 text-amber-950">
                    {inboxCount > 99 ? "99+" : inboxCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
