"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, CircleCheckBig, type LucideIcon } from "lucide-react";
import { Card, CardHeader, cn, toneClasses } from "@/components/ui/primitives";
import type { Tone } from "@/lib/studio/labels";

export type AttentionItem = {
  key: string;
  tone: Tone;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  href: string;
  cta: string;
};

/** "Needs your attention": the few things worth doing next, most urgent first. */
export function AttentionList({
  items,
  total,
  inboxHref,
  emptyHint,
}: {
  items: AttentionItem[];
  total: number;
  inboxHref?: string;
  emptyHint?: string;
}) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <CardHeader
          title="Needs your attention"
          description={items.length ? "The most useful things to do next, most urgent first." : undefined}
          className="mb-4"
          actions={
            inboxHref && total > items.length ? (
              <Link
                href={inboxHref}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 no-underline hover:underline dark:text-brand-300"
              >
                View all {total} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : undefined
          }
        />
      </div>
      {items.length === 0 ? (
        <div className="mx-5 mb-5 flex items-center gap-4 rounded-xl border border-dashed border-slate-200 px-5 py-6 sm:mx-6 sm:mb-6 dark:border-ink-line">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300">
            <CircleCheckBig className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="font-display text-[15px] font-bold text-slate-900 dark:text-white">You&apos;re all caught up</p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {emptyHint ?? "Nothing is waiting on you right now."}
            </p>
          </div>
        </div>
      ) : (
        <ul className="m-0 list-none divide-y divide-slate-100 border-t border-slate-100 p-0 dark:divide-ink-line dark:border-ink-line">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-4 px-5 py-4 no-underline transition hover:bg-slate-50/80 focus-visible:bg-slate-50 focus-visible:outline-none sm:px-6 dark:hover:bg-white/[0.03] dark:focus-visible:bg-white/[0.03]"
                >
                  <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", toneClasses(item.tone))}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wider",
                          item.tone === "warning"
                            ? "text-amber-700 dark:text-amber-300"
                            : item.tone === "danger"
                              ? "text-rose-600 dark:text-rose-300"
                              : "text-slate-400 dark:text-slate-500",
                        )}
                      >
                        {item.eyebrow}
                      </span>
                      {item.meta && <span className="text-xs text-slate-400 dark:text-slate-500">· {item.meta}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-bold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
                    )}
                  </span>
                  <span className="hidden flex-shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200 transition group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600 sm:inline-flex dark:text-slate-300 dark:ring-ink-line dark:group-hover:bg-brand-400 dark:group-hover:text-[#06130d] dark:group-hover:ring-brand-400">
                    {item.cta}
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 sm:hidden" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
