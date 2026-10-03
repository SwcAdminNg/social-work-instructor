"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Clock3, ExternalLink, MoreHorizontal, PencilLine, Star, Trash2 } from "lucide-react";
import { Badge, Skeleton, cn } from "@/components/ui/primitives";
import { Menu, type MenuItem } from "@/components/ui/overlays";
import { LifecycleBadge, VersionBadge } from "@/components/studio/StatusBadges";
import { CATEGORY_LABELS, LEVEL_LABELS, formatMinutes, formatMoney } from "@/lib/studio/labels";
import type { ManagedCourse } from "@/lib/studio/types";
import { CourseCover } from "./CourseCover";
import { courseLifecycle, revisionPill, type OpenRevisionInfo } from "./courseStatus";
import { useOpenRevision, useSeen } from "./useOpenRevision";

export type CourseView = "grid" | "list";

type Props = {
  course: ManagedCourse;
  view: CourseView;
  governanceEnabled: boolean;
  knownRevision?: OpenRevisionInfo;
  onDelete: (course: ManagedCourse) => void;
  /** Reports a lazily-discovered revision status so filters can use it. */
  onRevisionResolved?: (courseId: string, status: string | null) => void;
};

function priceLabel(course: ManagedCourse) {
  if (course.is_free !== false) return "Free";
  return formatMoney(course.price);
}

export function CourseCard({ course, view, governanceEnabled, knownRevision, onDelete, onRevisionResolved }: Props) {
  const router = useRouter();
  const { ref, seen } = useSeen<HTMLDivElement>();
  const lifecycle = courseLifecycle(course, governanceEnabled);
  const { revision, loading } = useOpenRevision(course.id, knownRevision, governanceEnabled, seen);
  const pill = governanceEnabled ? revisionPill(revision?.status, lifecycle) : null;
  const href = `/dashboard/courses/${course.id}`;

  const resolvedStatus = revision?.status ?? null;
  useEffect(() => {
    if (!knownRevision && !loading && seen && governanceEnabled) onRevisionResolved?.(course.id, resolvedStatus);
  }, [course.id, knownRevision, loading, seen, governanceEnabled, resolvedStatus, onRevisionResolved]);

  const meta = [course.category && CATEGORY_LABELS[course.category], course.level && LEVEL_LABELS[course.level]]
    .filter(Boolean)
    .join(" · ");
  const duration = formatMinutes(course.estimated_total_minutes);
  const rating = (course.total_reviews ?? 0) > 0 ? course.average_rating ?? 0 : null;
  const canDelete = course.governance_status === "DRAFT" && !course.is_published;

  const items: MenuItem[] = [
    { label: "Open editor", icon: PencilLine, onSelect: () => router.push(href) },
  ];
  if (lifecycle === "PUBLISHED" && course.slug) {
    items.push({
      label: "Preview on site",
      icon: ExternalLink,
      onSelect: () => window.open(`/courses/${course.slug}`, "_blank", "noopener,noreferrer"),
    });
  }
  if (canDelete) items.push("separator", { label: "Delete course", icon: Trash2, danger: true, onSelect: () => onDelete(course) });

  const menu = (
    <Menu
      items={items}
      trigger={
        <button
          type="button"
          aria-label={`Actions for ${course.title}`}
          className={cn(
            "grid h-8 w-8 cursor-pointer place-items-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
            view === "grid"
              ? "bg-white/85 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:bg-ink-surface/85 dark:text-slate-200 dark:hover:bg-ink-surface"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white",
          )}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </button>
      }
    />
  );

  const badges = (
    <div className="flex flex-wrap items-center gap-1.5">
      <LifecycleBadge lifecycle={lifecycle} size="xs" />
      <VersionBadge label={course.current_version_label} size="xs" />
      {loading ? (
        <Skeleton className="h-5 w-20 rounded-full" />
      ) : (
        pill && (
          <Badge tone={pill.tone} size="xs">
            {pill.label}
          </Badge>
        )
      )}
    </div>
  );

  const facts = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span className={cn("font-semibold", course.is_free !== false ? "text-brand-700 dark:text-brand-300" : "text-slate-800 dark:text-slate-100")}>
        {priceLabel(course)}
      </span>
      {duration && (
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
          {duration}
        </span>
      )}
      {rating !== null && (
        <span className="inline-flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" strokeWidth={2} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{rating.toFixed(1)}</span>
          <span>({course.total_reviews})</span>
        </span>
      )}
    </div>
  );

  if (view === "list") {
    return (
      <div
        ref={ref}
        className="group relative flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 pr-4 transition hover:border-brand-200 hover:shadow-[0_12px_32px_-24px_rgba(45,106,79,0.5)] dark:border-ink-line dark:bg-ink-surface dark:hover:border-brand-500/40"
      >
        <CourseCover
          title={course.title}
          seed={course.id}
          thumbnailUrl={course.thumbnail_url}
          category={course.category}
          size="sm"
          className="h-16 w-24 flex-shrink-0 rounded-xl sm:h-[72px] sm:w-32"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="line-clamp-1 font-display text-[15px] font-bold text-slate-900 no-underline after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-brand-700 dark:text-white dark:hover:text-brand-300"
          >
            {course.title || "Untitled course"}
          </Link>
          {meta && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{meta}</p>}
          <div className="mt-2 sm:hidden">{badges}</div>
        </div>
        <div className="hidden flex-shrink-0 sm:block">{badges}</div>
        <div className="hidden w-40 flex-shrink-0 justify-end lg:flex">{facts}</div>
        <div className="relative z-10 flex-shrink-0">{menu}</div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_18px_40px_-24px_rgba(45,106,79,0.45)] dark:border-ink-line dark:bg-ink-surface dark:hover:border-brand-500/40"
    >
      <CourseCover
        title={course.title}
        seed={course.id}
        thumbnailUrl={course.thumbnail_url}
        category={course.category}
        className="aspect-[16/9] w-full"
      />
      <div className="absolute right-3 top-3 z-10">{menu}</div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          {meta && <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{meta}</p>}
          <Link
            href={href}
            className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-snug text-slate-900 no-underline after:absolute after:inset-0 after:content-[''] group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300"
          >
            {course.title || "Untitled course"}
          </Link>
        </div>
        {badges}
        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-ink-line">{facts}</div>
      </div>
    </div>
  );
}

export function CourseCardSkeleton({ view }: { view: CourseView }) {
  if (view === "list") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-ink-line dark:bg-ink-surface">
        <Skeleton className="h-16 w-24 rounded-xl sm:h-[72px] sm:w-32" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="hidden h-5 w-28 rounded-full sm:block" />
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-ink-line dark:bg-ink-surface">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
