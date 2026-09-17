"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconChevronsLeft } from "@/components/dashboard/icons";
import { IconCheck } from "@/components/auth/shared/icons";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
  HelpCircle,
  Link2,
  Lock,
  Menu,
  PlayCircle,
  Star,
  X,
} from "lucide-react";
import { ReviewModal } from "./ReviewModal";
import { ResourceRead, formatResourceCategory } from "@/lib/resources";

type ReviewValue = {
  id: string;
  rating: number;
  review_text?: string;
};

type CurriculumItem = {
  id: string;
  title: string;
  item_type?: string | null;
  assessment_type?: string | null;
  is_completed?: boolean | null;
  estimated_minutes?: number | null;
};

type CurriculumSection = {
  id: string;
  title: string;
  items?: CurriculumItem[] | null;
  is_locked?: boolean | null;
  guest_instructors?: GuestInstructor[] | null;
};

type Curriculum = {
  course_title?: string | null;
  progress_percent?: number | null;
  total_reviews?: number | null;
  average_rating?: number | null;
  sections?: CurriculumSection[] | null;
};

type GuestInstructor = {
  user_id?: string | null;
  name?: string | null;
  profile_picture_url?: string | null;
  is_guest?: boolean | null;
};

interface CourseSidebarProps {
  courseId: string;
  curriculum: Curriculum;
  resources?: ResourceRead[];
}

export function CourseSidebar({ courseId, curriculum, resources = [] }: CourseSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userReview, setUserReview] = useState<ReviewValue | null>(null);

  const progress = Math.min(Math.max(Number(curriculum.progress_percent || 0), 0), 100);
  const sections = curriculum.sections || [];
  const allItems = sections.flatMap((section) => section.items || []);
  const activeItem = allItems.find((item) =>
    pathname.startsWith(`/learn/${courseId}/item/${item.id}`),
  );
  const completedCount = allItems.filter((item) => item.is_completed).length;
  const totalEstimatedMinutes = allItems.reduce(
    (total, item) => total + getEstimatedMinutes(item),
    0,
  );

  const fetchUserReview = useCallback(async () => {
    try {
      const res = await fetch(`/api/proxy/courses/${courseId}/reviews/me`);
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.id) {
          setUserReview(data.data);
          localStorage.setItem(`has_reviewed_${courseId}`, "true");
        }
      }
    } catch (e) {
      console.error("Failed to fetch user review", e);
    }
  }, [courseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchUserReview();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchUserReview]);

  const SidebarContent = (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-[#111525]">
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#dceee4] px-4 dark:border-[#27433a]">
        <Link
          href="/dashboard/courses"
          className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-[#2D6A4F] transition hover:text-[#1B4332] dark:text-[#b7e4c7] dark:hover:text-[#d8f3dc]"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <IconChevronsLeft />
          </span>
          <span className="truncate">My courses</span>
        </Link>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close curriculum"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-shrink-0 border-b border-[#dceee4] p-4 dark:border-[#27433a]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#2D6A4F] dark:text-[#b7e4c7]">
              Learning Path
            </p>
            <h2 className="mt-1 line-clamp-2 text-sm font-extrabold leading-5 text-slate-950 dark:text-white">
              {curriculum.course_title || "Course Curriculum"}
            </h2>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="inline-flex h-8 flex-shrink-0 items-center gap-1 rounded-md border border-[#b7e4c7] px-2.5 text-xs font-bold text-[#2D6A4F] transition hover:bg-[#f0fbf5] dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
          >
            <Star className="h-3.5 w-3.5" />
            {userReview ? "Edit" : "Rate"}
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>{completedCount}/{allItems.length || 0} complete</span>
          <span>{totalEstimatedMinutes > 0 ? `${formatMinutes(totalEstimatedMinutes)} total` : `${progress}%`}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Curriculum progress"
          className="h-1.5 overflow-hidden rounded-full bg-[#e3ede7] dark:bg-[#24372e]"
        >
          <div
            className="h-full bg-[#2D6A4F] transition-all duration-500 dark:bg-[#52b788]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {Number(curriculum.total_reviews || 0) > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>{Number(curriculum.average_rating || 0).toFixed(1)}</span>
            <span>({curriculum.total_reviews} reviews)</span>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {sections.map((section, sectionIndex) => {
          const isSectionLocked = section.is_locked === true;
          const guestLabel = formatGuestInstructors(section.guest_instructors);

          return (
          <section
            key={section.id}
            className={`mb-3 overflow-hidden rounded-lg border border-[#e3ede7] bg-[#fbfefd] dark:border-[#27433a] dark:bg-[#0f1726] ${
              isSectionLocked ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#e3ede7] px-3 py-2 dark:border-[#27433a]">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-[#2D6A4F] dark:text-[#b7e4c7]">
                  Module {sectionIndex + 1}
                </p>
                <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">
                  {section.title}
                </h3>
                {guestLabel && (
                  <p className="mt-1 line-clamp-1 text-[0.68rem] font-bold text-slate-500 dark:text-slate-400">
                    {guestLabel}
                  </p>
                )}
              </div>
              {isSectionLocked && (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            <ul className="divide-y divide-[#edf5f0] dark:divide-[#24372e]">
              {(() => {
                const items = section.items || [];
                const firstIncompleteIndex = items.findIndex((i) => !i.is_completed);
                const frontierIndex = firstIncompleteIndex === -1 ? items.length : firstIncompleteIndex;

                return items.map((item, itemIndex) => {
                const itemUrl = `/learn/${courseId}/item/${item.id}`;
                const isActive = pathname.startsWith(itemUrl);
                const isLiveSession = item.item_type === "LIVE_SESSION";
                const isSequentialLocked = !isSectionLocked && !isLiveSession && itemIndex > frontierIndex;
                const isItemBlocked = isSectionLocked || isSequentialLocked;

                const itemInner = (
                  <>
                    <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                      item.is_completed
                        ? "border-[#2D6A4F] bg-[#2D6A4F] text-white dark:border-[#52b788] dark:bg-[#52b788] dark:text-[#06130d]"
                        : isActive
                          ? "border-[#2D6A4F] text-[#2D6A4F] dark:border-[#52b788] dark:text-[#52b788]"
                          : "border-[#cfe8da] text-slate-400 dark:border-[#315244] dark:text-slate-500"
                    }`}>
                      {isItemBlocked ? (
                        <Lock className="h-3 w-3" />
                      ) : item.is_completed ? (
                        <span className="flex h-3 w-3 items-center justify-center [&>svg]:h-full [&>svg]:w-full">
                          <IconCheck />
                        </span>
                      ) : (
                        getItemIcon(item)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className={`block line-clamp-2 text-sm font-bold leading-5 ${
                        isActive ? "text-[#1B4332] dark:text-[#d8f3dc]" : ""
                      }`}>
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {isSectionLocked
                          ? "Locked"
                          : isSequentialLocked
                            ? "Complete previous item first"
                            : isLiveSession
                              ? getLiveSessionMetaLabel(item)
                              : getItemMetaLabel(item)}
                      </span>
                    </span>
                  </>
                );

                if (isItemBlocked) {
                  return (
                    <li key={item.id}>
                      <div
                        className="grid cursor-not-allowed grid-cols-[20px_minmax(0,1fr)] items-start gap-2 px-3 py-2.5 text-slate-500 dark:text-slate-400"
                        aria-disabled="true"
                      >
                        {itemInner}
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <Link
                      href={itemUrl}
                      onClick={() => setIsOpen(false)}
                      className={`group grid grid-cols-[20px_minmax(0,1fr)_16px] items-start gap-2 px-3 py-2.5 transition ${
                        isActive
                          ? "bg-[#e7f6ee] text-[#1B4332] dark:bg-[#52b788]/12 dark:text-[#d8f3dc]"
                          : "text-slate-700 hover:bg-[#f0fbf5] hover:text-[#2D6A4F] dark:text-slate-300 dark:hover:bg-[#52b788]/10 dark:hover:text-[#b7e4c7]"
                      }`}
                    >
                      {itemInner}
                      <ChevronRight className={`mt-1 h-4 w-4 transition ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                    </Link>
                  </li>
                );
                });
              })()}
            </ul>
          </section>
          );
        })}

        {resources.length > 0 && (
          <section className="mb-3 overflow-hidden rounded-lg border border-[#e3ede7] bg-[#fbfefd] dark:border-[#27433a] dark:bg-[#0f1726]">
            <div className="border-b border-[#e3ede7] px-3 py-2 dark:border-[#27433a]">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-wide text-[#2D6A4F] dark:text-[#b7e4c7]">
                Course resources
              </p>
              <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-900 dark:text-white">
                Templates, readings & links
              </h3>
            </div>
            <ul className="divide-y divide-[#edf5f0] dark:divide-[#24372e]">
              {resources.map((resource) => {
                const resourceUrl = `/resources/${resource.slug || resource.id}`;
                const isLocked = resource.can_access === false;

                return (
                  <li key={resource.id}>
                    <Link
                      href={resourceUrl}
                      onClick={() => setIsOpen(false)}
                      className="group grid grid-cols-[20px_minmax(0,1fr)_16px] items-start gap-2 px-3 py-2.5 text-slate-700 transition hover:bg-[#f0fbf5] hover:text-[#2D6A4F] dark:text-slate-300 dark:hover:bg-[#52b788]/10 dark:hover:text-[#b7e4c7]"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${
                          isLocked
                            ? "border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500"
                            : "border-[#cfe8da] text-[#2D6A4F] dark:border-[#315244] dark:text-[#b7e4c7]"
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          getResourceIcon(resource.category)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block line-clamp-2 text-sm font-bold leading-5">
                          {resource.name}
                        </span>
                        <span className="mt-0.5 block text-[0.68rem] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {isLocked
                            ? getResourceLockLabel(resource)
                            : formatResourceCategory(resource.category)}
                        </span>
                      </span>
                      <ChevronRight className="mt-1 h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-[#e3ede7] p-3 dark:border-[#27433a]">
              <Link
                href={`/resources?course_id=${courseId}`}
                onClick={() => setIsOpen(false)}
                className="flex h-9 items-center justify-center rounded-md border border-[#b7e4c7] text-xs font-extrabold text-[#2D6A4F] transition hover:bg-[#f0fbf5] dark:border-[#27433a] dark:text-[#b7e4c7] dark:hover:bg-[#183026]"
              >
                View all course resources
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-[334px] flex-shrink-0 overflow-hidden border-l border-[#dceee4] bg-white shadow-sm dark:border-[#27433a] dark:bg-[#111525] lg:flex">
        {SidebarContent}
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[88vw] max-w-[360px] flex-col overflow-hidden border-l border-[#dceee4] bg-white shadow-2xl transition-transform duration-300 dark:border-[#27433a] dark:bg-[#111525] lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {SidebarContent}
      </aside>

      <div className="fixed inset-x-3 bottom-3 z-30 rounded-lg border border-[#dceee4] bg-white/95 p-2 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.6)] backdrop-blur dark:border-[#27433a] dark:bg-[#111525]/95 lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-[#f0fbf5] dark:hover:bg-[#183026]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
            <Menu className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold text-slate-950 dark:text-white">
              {activeItem?.title || curriculum.course_title || "Course outline"}
            </span>
            <span
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course progress"
              className="mt-1 block h-1 overflow-hidden rounded-full bg-[#e3ede7] dark:bg-[#24372e]"
            >
              <span
                className="block h-full bg-[#2D6A4F] dark:bg-[#52b788]"
                style={{ width: `${progress}%` }}
              />
            </span>
          </span>
          <span className="rounded-md border border-[#b7e4c7] px-2 py-1 text-xs font-extrabold text-[#2D6A4F] dark:border-[#27433a] dark:text-[#b7e4c7]">
            {progress}%
          </span>
        </button>
      </div>

      <ReviewModal
        courseId={courseId}
        isOpen={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        onDismiss={() => {}}
        existingReview={userReview}
        onReviewSubmitted={() => {
          fetchUserReview();
          router.refresh();
        }}
      />
    </>
  );
}

function getItemIcon(item: CurriculumItem) {
  const type = item.item_type;

  if (type === "VIDEO") return <PlayCircle className="h-3.5 w-3.5" />;
  if (type === "DOCUMENT") return <FileText className="h-3.5 w-3.5" />;
  if (type === "LINKS") return <Link2 className="h-3.5 w-3.5" />;
  if (type === "LIVE_SESSION") return <CalendarDays className="h-3.5 w-3.5" />;
  if (type === "ASSESSMENT" || type === "QUIZ" || type === "ESSAY") {
    return <HelpCircle className="h-3.5 w-3.5" />;
  }

  return <BookOpen className="h-3.5 w-3.5" />;
}

function getResourceIcon(category?: string) {
  if (category === "VIDEOS_AND_WEBINARS") return <PlayCircle className="h-3.5 w-3.5" />;
  if (category === "USEFUL_LINKS") return <Link2 className="h-3.5 w-3.5" />;
  return <FileText className="h-3.5 w-3.5" />;
}

function getResourceLockLabel(resource: ResourceRead) {
  if (resource.access_reason === "LOGIN_REQUIRED") return "Log in to unlock";
  if (resource.access_reason === "ENROLLMENT_REQUIRED") return "Enrollment required";
  return "Locked";
}

function formatGuestInstructors(guests?: GuestInstructor[] | null) {
  const names = (guests || [])
    .map((guest) => guest.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) return null;
  return `${names.length === 1 ? "Guest lecturer" : "Guest lecturers"}: ${names.join(", ")}`;
}

function getItemLabel(item: { item_type?: string | null; assessment_type?: string | null }) {
  if (item.item_type === "ASSESSMENT" && item.assessment_type) {
    return `${titleCaseEnum(item.assessment_type)} assessment`;
  }

  return titleCaseEnum(item.item_type);
}

function getItemMetaLabel(item: CurriculumItem) {
  const estimate = getEstimatedMinutes(item);
  return estimate > 0
    ? `${getItemLabel(item)} - ${formatMinutes(estimate)}`
    : getItemLabel(item);
}

function getLiveSessionMetaLabel(item: CurriculumItem) {
  const estimate = getEstimatedMinutes(item);
  return estimate > 0 ? `Live session - ${formatMinutes(estimate)}` : "Live session";
}

function getEstimatedMinutes(item: { estimated_minutes?: number | null }) {
  return typeof item.estimated_minutes === "number" && item.estimated_minutes > 0
    ? item.estimated_minutes
    : 0;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function titleCaseEnum(value?: string | null) {
  if (!value) return "Item";
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
