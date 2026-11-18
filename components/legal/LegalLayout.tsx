import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { PageHero, cx } from "@/components/swcl/ui";

/** Compact text-only hero for the legal pages. */
export function LegalHero({ id, title, lead, updated }: { id: string; title: string; lead: string; updated: string }) {
  return (
    <PageHero id={id} eyebrow="Legal" title={title} lead={lead} compact>
      <p className="m-0 inline-flex items-center gap-2 text-[0.92rem] text-white/85">
        <CalendarDays aria-hidden="true" className="h-4 w-4 text-swc-gold-light" />
        Last updated: {updated}
      </p>
    </PageHero>
  );
}

/** Readable column with a sticky table of contents on wide screens. */
export function LegalBody({
  sections,
  children,
  label = "On this page",
}: {
  sections: { id: string; title: string }[];
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="swc-section bg-swc-white">
      <div className="swc-wrap grid gap-12 min-[1001px]:grid-cols-[240px_minmax(0,760px)] min-[1001px]:justify-between">
        <nav aria-label={label} className="hidden min-[1001px]:block">
          <div className="sticky top-28">
            <p className="swc-eyebrow">{label}</p>
            <ol className="m-0 mt-4 list-none border-l border-swc-line p-0">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l-2 border-transparent py-2 pl-4 text-[0.92rem] font-medium text-swc-ink-2 no-underline hover:border-swc-gold hover:text-swc-ink"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
        <article className="min-w-0 max-w-[760px]">{children}</article>
      </div>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} id={id} className="border-t border-swc-line py-10 first:border-t-0 first:pt-0 last:pb-0">
      <h2 id={`${id}-title`} className="swc-h3 text-swc-ink">
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-4 text-[1rem] leading-[1.7] text-swc-ink-2">{children}</div>
    </section>
  );
}

export function LegalList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx("m-0 flex list-disc flex-col gap-2.5 pl-5 marker:text-swc-label", className)}>{children}</ul>;
}

export const legalLink = "font-semibold text-swc-label underline underline-offset-4 hover:text-swc-ink";
