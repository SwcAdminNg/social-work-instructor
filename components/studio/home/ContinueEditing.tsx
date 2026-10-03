"use client";

import Link from "next/link";
import { ArrowRight, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { LifecycleBadge, VersionBadge } from "@/components/studio/StatusBadges";
import { CourseCover } from "@/components/studio/courses/CourseCover";
import { courseLifecycle, revisionPill, type OpenRevisionInfo } from "@/components/studio/courses/courseStatus";
import { CATEGORY_LABELS, LEVEL_LABELS, formatMinutes } from "@/lib/studio/labels";
import type { ManagedCourse } from "@/lib/studio/types";

export function ContinueEditing({
  courses,
  revisions,
  governanceEnabled,
  total,
}: {
  courses: ManagedCourse[];
  revisions: Record<string, OpenRevisionInfo>;
  governanceEnabled: boolean;
  total: number;
}) {
  if (!courses.length) return null;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">Continue editing</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick up where you left off.</p>
        </div>
        <Link
          href="/dashboard/courses"
          className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 no-underline hover:underline dark:text-brand-300"
        >
          {total > courses.length ? `All ${total} courses` : "All courses"} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {courses.map((course) => {
          const lifecycle = courseLifecycle(course, governanceEnabled);
          const rev = revisions[course.id];
          const pill = governanceEnabled ? revisionPill(rev?.status, lifecycle) : null;
          const tab = rev?.status === "RETURNED_FOR_REVISION" ? "review" : "curriculum";
          const meta = [course.category && CATEGORY_LABELS[course.category], course.level && LEVEL_LABELS[course.level]]
            .filter(Boolean)
            .join(" · ");
          const duration = formatMinutes(course.estimated_total_minutes);
          return (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}?tab=${tab}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white no-underline shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgba(45,106,79,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 dark:border-ink-line dark:bg-ink-surface dark:hover:border-brand-500/40"
            >
              <CourseCover
                title={course.title}
                seed={course.id}
                thumbnailUrl={course.thumbnail_url}
                category={course.category}
                className="aspect-[16/8] w-full"
              >
                <span className="absolute bottom-3 right-3 inline-flex translate-y-1 items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100 dark:bg-ink-surface/95 dark:text-white">
                  <PencilLine className="h-3.5 w-3.5" /> Edit
                </span>
              </CourseCover>
              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="min-w-0">
                  {meta && <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{meta}</p>}
                  <p className="mt-0.5 line-clamp-2 font-display text-[15px] font-bold leading-snug text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                    {course.title || "Untitled course"}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-1.5">
                  <LifecycleBadge lifecycle={lifecycle} size="xs" />
                  <VersionBadge label={course.current_version_label} size="xs" />
                  {pill && (
                    <Badge tone={pill.tone} size="xs">
                      {pill.label}
                    </Badge>
                  )}
                  {duration && <span className="ml-auto text-xs text-slate-400">{duration}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
