"use client";

import { useState } from "react";
import {
  Award,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  Layers,
  Link2,
  ListChecks,
  PenLine,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Badge, Button, Callout, EmptyState, Skeleton, cn } from "@/components/ui/primitives";
import {
  ASSESSMENT_TYPE_LABELS,
  CATEGORY_LABELS,
  ITEM_TYPE_LABELS,
  LEVEL_LABELS,
  formatDateTime,
  formatMinutes,
} from "@/lib/studio/labels";
import type { AssessmentType, CourseCategory, CourseLevel, InstructorCredit, ItemType } from "@/lib/studio/types";

/* Loose learner-format shapes: the preview endpoint mirrors the learner course
   detail, so every field is treated as optional. */
type PreviewQuestion = { id?: string; text?: string; options?: { id?: string; text?: string }[] };
export type PreviewItem = {
  id: string;
  title?: string;
  item_type?: string;
  order_index?: number;
  is_preview?: boolean;
  estimated_minutes?: number | null;
  assessment_type?: string;
  video?: { duration_seconds?: number | null; status?: string } | null;
  document?: { file_name?: string; file_size_bytes?: number | null } | null;
  link?: { url?: string; label?: string | null; description?: string | null } | null;
  live_session?: { scheduled_start_at?: string; duration_minutes?: number; guest_name?: string | null; guest_title?: string | null } | null;
  assessment?: {
    assessment_type?: string;
    is_final_assessment?: boolean;
    quiz?: { pass_mark_percentage?: number; max_attempts?: number | null; questions?: PreviewQuestion[] } | null;
    essay?: { question?: string; description?: string; pass_mark_percentage?: number; submission_mode?: string } | null;
    quiz_group?: {
      pass_mark_percentage?: number;
      time_limit_seconds?: number | null;
      sections?: { id?: string; title?: string; question_count?: number; questions_to_ask?: number | null; questions?: unknown[] }[];
    } | null;
  } | null;
};
export type PreviewSection = {
  id: string;
  title?: string;
  order_index?: number;
  items?: PreviewItem[];
  guest_instructors?: InstructorCredit[];
};
export type PreviewCourse = {
  title?: string;
  description?: string;
  thumbnail_url?: string | null;
  level?: CourseLevel | string;
  category?: CourseCategory | string;
  what_you_will_learn?: string[];
  requirements?: string[];
  material_includes?: string[];
  prerequisite?: string | null;
  instructors?: InstructorCredit[];
  certificate_enabled?: boolean;
  estimated_total_minutes?: number;
};

const ITEM_ICONS: Record<ItemType, LucideIcon> = {
  VIDEO: PlayCircle,
  DOCUMENT: FileText,
  LINKS: Link2,
  LIVE_SESSION: CalendarDays,
  ASSESSMENT: ClipboardCheck,
};

function itemMinutes(item: PreviewItem) {
  if (typeof item.estimated_minutes === "number" && item.estimated_minutes > 0) return item.estimated_minutes;
  if (item.video?.duration_seconds) return Math.round(item.video.duration_seconds / 60);
  if (item.live_session?.duration_minutes) return item.live_session.duration_minutes;
  return 0;
}

function assessmentType(item: PreviewItem) {
  return (item.assessment?.assessment_type ?? item.assessment_type) as AssessmentType | undefined;
}

function sortByOrder<T extends { order_index?: number }>(list?: T[]) {
  return [...(list ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

export type CoursePreviewProps = {
  sections?: PreviewSection[] | null;
  course?: PreviewCourse | null;
  /** Shown when `course` is missing. */
  fallbackTitle?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
};

/**
 * The course as a learner sees it: hero, outcomes, requirements and the
 * module/lesson accordion. Never shows correct answers.
 */
export function CoursePreview({ sections, course, fallbackTitle, loading, error, onRetry, className }: CoursePreviewProps) {
  if (loading) return <PreviewSkeleton className={className} />;
  if (error) {
    return (
      <Callout
        tone="danger"
        title="The preview didn't load"
        className={className}
        actions={
          onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {error}
      </Callout>
    );
  }

  const modules = sortByOrder(sections ?? []);
  const lessons = modules.reduce((n, s) => n + (s.items?.length ?? 0), 0);
  const minutes = course?.estimated_total_minutes || modules.reduce((n, s) => n + (s.items ?? []).reduce((m, i) => m + itemMinutes(i), 0), 0);
  const title = course?.title || fallbackTitle || "Untitled course";

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 text-white shadow-[0_24px_60px_-30px_rgba(16,38,28,0.8)] dark:from-brand-900 dark:via-brand-800 dark:to-brand-700">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_260px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {course?.category && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                  {CATEGORY_LABELS[course.category as CourseCategory] ?? course.category}
                </span>
              )}
              {course?.level && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                  <BarChart3 className="h-3 w-3" />
                  {LEVEL_LABELS[course.level as CourseLevel] ?? course.level}
                </span>
              )}
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h2>
            {course?.description && <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-6 text-white/80">{course.description}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4" /> {modules.length} {modules.length === 1 ? "module" : "modules"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4" /> {lessons} {lessons === 1 ? "lesson" : "lessons"}
              </span>
              {minutes > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" /> {formatMinutes(minutes)}
                </span>
              )}
              {course?.certificate_enabled && (
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> Certificate
                </span>
              )}
            </div>
            {!!course?.instructors?.length && (
              <div className="mt-5 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {course.instructors.slice(0, 4).map((p, i) => (
                    <Avatar key={`${p.name}-${i}`} name={p.name} src={p.profile_picture_url} size="sm" className="ring-brand-700" />
                  ))}
                </div>
                <p className="min-w-0 truncate text-sm text-white/85">
                  Taught by <span className="font-semibold text-white">{course.instructors.map((p) => p.name).join(", ")}</span>
                </p>
              </div>
            )}
          </div>
          {course?.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail_url} alt="" className="hidden aspect-video w-full rounded-xl object-cover ring-1 ring-white/20 lg:block" />
          )}
        </div>
      </section>

      {/* Outcomes + requirements */}
      {(!!course?.what_you_will_learn?.length || !!course?.requirements?.length || !!course?.material_includes?.length || course?.prerequisite) && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          {!!course?.what_you_will_learn?.length && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-ink-line dark:bg-ink-surface">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">What you&apos;ll learn</h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {course.what_you_will_learn.map((o, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    <Check className="mt-1 h-4 w-4 flex-shrink-0 text-brand-600 dark:text-brand-300" strokeWidth={2.4} />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="flex flex-col gap-4">
            {(!!course?.requirements?.length || course?.prerequisite) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-ink-line dark:bg-ink-surface">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">Requirements</h3>
                {course?.prerequisite && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{course.prerequisite}</p>}
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700 marker:text-slate-300 dark:text-slate-200">
                  {(course?.requirements ?? []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            )}
            {!!course?.material_includes?.length && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-ink-line dark:bg-ink-surface">
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">This course includes</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
                  {course.material_includes.map((m, i) => (
                    <li key={i} className="flex gap-2">
                      <ListChecks className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                      {m}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      <CurriculumAccordion modules={modules} lessons={lessons} minutes={minutes} />
    </div>
  );
}

function CurriculumAccordion({ modules, lessons, minutes }: { modules: PreviewSection[]; lessons: number; minutes: number }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => (modules[0] ? { [modules[0].id]: true } : {}));
  const allOpen = modules.length > 0 && modules.every((m) => open[m.id]);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Course content</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {modules.length} modules · {lessons} lessons{minutes > 0 ? ` · ${formatMinutes(minutes)} total` : ""}
          </p>
        </div>
        {modules.length > 1 && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(allOpen ? {} : Object.fromEntries(modules.map((m) => [m.id, true])))}>
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        )}
      </div>

      {modules.length === 0 ? (
        <EmptyState compact icon={Layers} title="No modules yet" description="Learners will see the modules and lessons here once you add them." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-ink-line dark:bg-ink-surface">
          {modules.map((m, idx) => {
            const isOpen = !!open[m.id];
            const items = sortByOrder(m.items);
            const mins = items.reduce((n, i) => n + itemMinutes(i), 0);
            const guests = (m.guest_instructors ?? []).map((g) => g.name).filter(Boolean);
            return (
              <div key={m.id} className={cn(idx > 0 && "border-t border-slate-200 dark:border-ink-line")}>
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [m.id]: !o[m.id] }))}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center gap-3 bg-slate-50/70 px-4 py-3.5 text-left transition-colors hover:bg-slate-100/70 sm:px-5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                >
                  <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      <span className="text-slate-400">Module {idx + 1} · </span>
                      {m.title || "Untitled module"}
                    </p>
                    {guests.length > 0 && (
                      <p className="mt-0.5 truncate text-xs font-medium text-brand-700 dark:text-brand-300">
                        {guests.length === 1 ? "Guest lecturer" : "Guest lecturers"}: {guests.join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {items.length} {items.length === 1 ? "lesson" : "lessons"}
                    {mins > 0 && <span className="hidden sm:inline"> · {formatMinutes(mins)}</span>}
                  </span>
                </button>
                {isOpen && (
                  <ul className="divide-y divide-slate-100 dark:divide-ink-line">
                    {items.length === 0 && <li className="px-5 py-4 text-sm text-slate-500">This module is empty.</li>}
                    {items.map((item) => (
                      <LessonRow key={item.id} item={item} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LessonRow({ item }: { item: PreviewItem }) {
  const [expanded, setExpanded] = useState(false);
  const type = (item.item_type ?? "DOCUMENT") as ItemType;
  const Icon = ITEM_ICONS[type] ?? FileText;
  const aType = assessmentType(item);
  const mins = itemMinutes(item);
  const details = lessonDetails(item);
  const typeLabel = type === "ASSESSMENT" && aType ? ASSESSMENT_TYPE_LABELS[aType] ?? "Assessment" : ITEM_TYPE_LABELS[type] ?? "Lesson";
  const sub =
    type === "LIVE_SESSION"
      ? [formatDateTime(item.live_session?.scheduled_start_at), item.live_session?.guest_name].filter(Boolean).join(" · ")
      : type === "LINKS"
        ? item.link?.description
        : undefined;

  return (
    <li>
      <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
        <span className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.link?.label || item.title || "Untitled lesson"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{typeLabel}</span>
            {mins > 0 && type !== "LIVE_SESSION" && <span>· {formatMinutes(mins)}</span>}
            {sub && <span className="min-w-0 truncate">· {sub}</span>}
            {item.assessment?.is_final_assessment && (
              <Badge size="xs" tone="violet">
                Final assessment
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {item.is_preview && (
            <Badge size="xs" tone="warning" icon={Eye}>
              Free preview
            </Badge>
          )}
          {type === "LINKS" && item.link?.url && (
            <a
              href={item.link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open link"
              className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          {details && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? "Hide details" : "Show details"}
              className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/8"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
            </button>
          )}
        </div>
      </div>
      {expanded && details && <div className="px-4 pb-4 pl-[60px] sm:px-5 sm:pl-[64px]">{details}</div>}
    </li>
  );
}

/** What a learner sees inside an assessment (questions without answers). */
function lessonDetails(item: PreviewItem): React.ReactNode {
  const a = item.assessment;
  if (!a) return null;
  if (a.essay) {
    return (
      <div className="rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-white/[0.03]">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <PenLine className="h-3.5 w-3.5" /> Essay question
        </p>
        <p className="mt-1 whitespace-pre-wrap font-medium text-slate-800 dark:text-slate-100">{a.essay.question || "—"}</p>
        {a.essay.description && <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{a.essay.description}</p>}
        {typeof a.essay.pass_mark_percentage === "number" && <p className="mt-2 text-xs text-slate-500">Pass mark {a.essay.pass_mark_percentage}%</p>}
      </div>
    );
  }
  if (a.quiz) {
    const qs = a.quiz.questions ?? [];
    return (
      <div className="rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-white/[0.03]">
        <p className="text-xs text-slate-500">
          {qs.length} {qs.length === 1 ? "question" : "questions"}
          {typeof a.quiz.pass_mark_percentage === "number" && ` · pass mark ${a.quiz.pass_mark_percentage}%`}
          {a.quiz.max_attempts ? ` · ${a.quiz.max_attempts} attempts` : " · unlimited attempts"}
        </p>
        <ol className="mt-2 space-y-3">
          {qs.map((q, i) => (
            <li key={q.id ?? i}>
              <p className="flex gap-2 font-medium text-slate-800 dark:text-slate-100">
                <CircleHelp className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                {i + 1}. {q.text}
              </p>
              <ul className="mt-1.5 grid gap-1 pl-6 sm:grid-cols-2">
                {(q.options ?? []).map((o, oi) => (
                  <li key={o.id ?? oi} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 dark:border-ink-line dark:bg-transparent dark:text-slate-200">
                    {o.text}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    );
  }
  if (a.quiz_group) {
    const groups = a.quiz_group.sections ?? [];
    return (
      <div className="rounded-xl bg-slate-50 p-3.5 text-sm dark:bg-white/[0.03]">
        <p className="text-xs text-slate-500">
          Questions are drawn at random each attempt
          {a.quiz_group.time_limit_seconds ? ` · ${Math.round(a.quiz_group.time_limit_seconds / 60)} min time limit` : ""}
          {typeof a.quiz_group.pass_mark_percentage === "number" && ` · pass mark ${a.quiz_group.pass_mark_percentage}%`}
        </p>
        <ul className="mt-2 space-y-1">
          {groups.map((g, i) => (
            <li key={g.id ?? i} className="flex justify-between gap-3 text-slate-700 dark:text-slate-200">
              <span>{g.title}</span>
              <span className="text-xs text-slate-500">{g.question_count ?? g.questions_to_ask ?? g.questions?.length ?? 0} questions</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

function PreviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
