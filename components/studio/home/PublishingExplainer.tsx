"use client";

import { BadgeCheck, Hammer, Plus, Rocket, Send, UsersRound, type LucideIcon } from "lucide-react";
import { ButtonLink, cn } from "@/components/ui/primitives";

type Step = { icon: LucideIcon; title: string; body: string };

const GOVERNED: Step[] = [
  { icon: Hammer, title: "Build", body: "Add modules, lessons, videos and assessments. Everything stays private." },
  { icon: Send, title: "Submit", body: "Say what's in it and send it for review when it's ready." },
  { icon: UsersRound, title: "Review", body: "Academic, quality and course-lead reviewers check it, stage by stage." },
  { icon: BadgeCheck, title: "Published", body: "Once approved it goes live as version 1.0. Updates follow the same path." },
];

const CLASSIC: Step[] = [
  { icon: Hammer, title: "Build", body: "Add modules, lessons, videos and assessments. Everything stays private." },
  { icon: Rocket, title: "Publish", body: "Publish from the editor when it's ready — learners can enrol straight away." },
];

/** Compact "how it works" strip for first-run instructors. */
export function PublishingExplainer({ governanceEnabled, className }: { governanceEnabled: boolean; className?: string }) {
  const steps = governanceEnabled ? GOVERNED : CLASSIC;
  return (
    <ol className={cn("m-0 grid list-none gap-3 p-0", steps.length === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-2", className)}>
      {steps.map((s, i) => {
        const Icon = s.icon;
        const last = i === steps.length - 1;
        return (
          <li
            key={s.title}
            className="relative rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-ink-line dark:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-xl ring-1 ring-inset",
                  last
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-200/70 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20"
                    : "bg-brand-50 text-brand-600 ring-brand-200/70 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Step {i + 1}</span>
            </div>
            <p className="mt-3 font-display text-sm font-bold text-slate-900 dark:text-white">{s.title}</p>
            <p className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">{s.body}</p>
          </li>
        );
      })}
    </ol>
  );
}

/** First-run block: no courses yet. */
export function FirstRun({ governanceEnabled, canCreate }: { governanceEnabled: boolean; canCreate: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 dark:border-ink-line dark:bg-ink-surface">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-400/10" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">Get started</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Create your first course
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {governanceEnabled
                ? "Share your practice with social workers across Nigeria. Here's how a course goes from idea to live — nothing is visible to learners until it has been reviewed and published."
                : "Share your practice with social workers across Nigeria. Build at your own pace — nothing is visible to learners until you publish."}
            </p>
          </div>
          {canCreate && (
            <ButtonLink href="/dashboard/courses/new" icon={Plus} size="lg">
              Create a course
            </ButtonLink>
          )}
        </div>
        <PublishingExplainer governanceEnabled={governanceEnabled} />
      </div>
    </section>
  );
}
