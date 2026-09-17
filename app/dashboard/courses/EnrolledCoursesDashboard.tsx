"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CirclePlay,
  EllipsisVertical,
  Search,
  Trophy,
} from "lucide-react";
import { getCourseDurationLabel } from "@/lib/courseDuration";

export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

type InstructorValue =
  | string
  | {
      id?: string | null;
      user_id?: string | null;
      name?: string | null;
      full_name?: string | null;
      display_name?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      username?: string | null;
      title?: string | null;
      role?: string | null;
      headline?: string | null;
      avatar_url?: string | null;
      profile_picture_url?: string | null;
      image_url?: string | null;
      photo_url?: string | null;
    };

type Instructor = {
  id?: string | null;
  name: string;
  title?: string | null;
  avatar_url?: string | null;
};

export type Course = {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  instructor_id?: string | null;
  instructor_name?: string | null;
  instructor?: InstructorValue | null;
  instructors?: InstructorValue[] | null;
  is_bookmarked?: boolean | null;
  is_enrolled?: boolean | null;
  progress_status?: ProgressStatus | null;
  progress_percent?: number | null;
  is_completed?: boolean | null;
  content_updated_at?: string | null;
  has_new_content?: boolean | null;
  updated_at?: string | null;
  access_end_date?: string | null;
  access_start_date?: string | null;
  estimated_total_minutes?: number | null;
  estimated_duration?: string | null;
  certificate_enabled?: boolean | null;
};

export type DashboardStats = {
  total_courses_enrolled: number;
  quizzes_attempted: number;
  completion_rate: number;
  total_reviews: number;
  in_process_courses: number;
  completed_courses: number;
  not_started_courses: number;
  bookmarked_courses: number;
};

export type Meta = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type CourseView = "ALL" | "IN_PROGRESS" | "NOT_STARTED" | "COMPLETED" | "SAVED";

type DisplayCourse = Course & {
  displayStatus: ProgressStatus | null;
  displayProgress: number;
  bookmarked: boolean;
  enrolled: boolean;
  wishlist: boolean;
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1573497491208-6b1acb260507?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop",
];

const tabs: Array<{ key: CourseView; label: string }> = [
  { key: "ALL", label: "All Courses" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "COMPLETED", label: "Completed" },
  { key: "SAVED", label: "Saved" },
];

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 800;

function clampPercent(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getStatus(course: Course): ProgressStatus | null {
  if (course.progress_status) return course.progress_status;
  if (course.is_completed) return "COMPLETED";

  const percent = clampPercent(course.progress_percent);
  if (percent === null) return null;
  if (percent >= 100) return "COMPLETED";
  if (percent > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

function getProgress(course: Course, status: ProgressStatus | null) {
  const percent = clampPercent(course.progress_percent);
  if (percent !== null) return percent;
  if (status === "COMPLETED") return 100;
  if (status === "IN_PROGRESS") return 45;
  return 0;
}

function normalizeCourse(course: Course, view: CourseView): DisplayCourse {
  const enrolled = view === "SAVED" ? course.is_enrolled === true : course.is_enrolled !== false;
  const wishlist = view === "SAVED" && !enrolled;
  const displayStatus = wishlist ? null : getStatus(course);

  return {
    ...course,
    displayStatus,
    displayProgress: getProgress(course, displayStatus),
    bookmarked: course.is_bookmarked === true,
    enrolled,
    wishlist,
  };
}

function normalizeInstructor(
  value: InstructorValue | null | undefined,
): Instructor | null {
  if (!value) return null;

  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name } : null;
  }

  const firstLast = [value.first_name, value.last_name].filter(Boolean).join(" ");
  const name =
    value.name ||
    value.full_name ||
    value.display_name ||
    firstLast ||
    value.username;

  if (!name) return null;

  return {
    id: value.id || value.user_id,
    name,
    title: value.title || value.role || value.headline,
    avatar_url:
      value.profile_picture_url ||
      value.avatar_url ||
      value.image_url ||
      value.photo_url,
  };
}

function getInstructor(course: Course): Instructor {
  const candidates: Array<InstructorValue | null | undefined> = [
    course.instructor,
    course.instructor_name,
    ...(Array.isArray(course.instructors) ? course.instructors : []),
  ];

  for (const candidate of candidates) {
    const instructor = normalizeInstructor(candidate);
    if (instructor) return instructor;
  }

  return course.instructor_id
    ? { id: course.instructor_id, name: "Course instructor" }
    : { name: "SWCL Faculty" };
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: ProgressStatus | null) {
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "COMPLETED") return "Completed";
  return "Not Started";
}

function statusClasses(status: ProgressStatus | null, wishlist = false) {
  if (wishlist) {
    return "bg-[#f43f7f] text-white";
  }
  if (status === "COMPLETED") {
    return "bg-[#12a150] text-white";
  }
  if (status === "IN_PROGRESS") {
    return "bg-[#5b2dcc] text-white";
  }
  return "bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-950";
}

function actionLabel(
  status: ProgressStatus | null,
  savedOnly: boolean,
  wishlist: boolean,
) {
  if (wishlist) return "Details";
  if (savedOnly && !status) return "Start";
  if (status === "COMPLETED") return "Review";
  if (status === "IN_PROGRESS") return "Continue";
  return "Start";
}

function actionHref(course: DisplayCourse) {
  if (course.wishlist) return `/dashboard/course-catalogue/${course.slug || course.id}`;
  if (course.enrolled) return `/learn/${course.id}`;
  if (course.displayStatus) return `/learn/${course.id}`;
  return `/dashboard/course-catalogue/${course.slug || course.id}`;
}

function uniqueCourses(courses: Course[]) {
  const seen = new Set<string>();
  return courses.filter((course) => {
    if (!course.id || seen.has(course.id)) return false;
    seen.add(course.id);
    return true;
  });
}

function normalizeCourses(courses: Course[], view: CourseView) {
  return uniqueCourses(courses).map((course) =>
    normalizeCourse(
      view === "SAVED" ? { ...course, is_bookmarked: true } : course,
      view,
    ),
  );
}

function buildApiUrl(view: CourseView, page: number, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(PAGE_SIZE),
  });

  if (view !== "SAVED") {
    if (search.trim()) params.set("search", search.trim());
    if (view !== "ALL") params.set("status", view);
    return `/api/proxy/courses/enrolled?${params.toString()}`;
  }

  return `/api/proxy/courses/bookmarked?${params.toString()}`;
}

function buildBrowserHref(view: CourseView, page: number, search: string) {
  const params = new URLSearchParams();

  if (page > 1) params.set("page", String(page));
  if (view === "SAVED") {
    params.set("tab", "saved");
  } else {
    if (search.trim()) params.set("search", search.trim());
    if (view !== "ALL") params.set("status", view);
  }

  const query = params.toString();
  return query ? `/dashboard/courses?${query}` : "/dashboard/courses";
}

function mergeMeta(meta: Meta, next: Partial<Meta> | undefined, page: number): Meta {
  return {
    ...meta,
    page,
    page_size: PAGE_SIZE,
    ...(next ?? {}),
  };
}

function updateBookmarkedStat(stats: DashboardStats, delta: number): DashboardStats {
  return {
    ...stats,
    bookmarked_courses: Math.max(0, stats.bookmarked_courses + delta),
  };
}

function updateSavedMeta(meta: Meta, delta: number): Meta {
  const totalItems = Math.max(0, meta.total_items + delta);
  const totalPages = Math.max(1, Math.ceil(totalItems / meta.page_size));

  return {
    ...meta,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: meta.page < totalPages,
    has_previous: meta.page > 1,
  };
}

export function EnrolledCoursesDashboard({
  stats,
  courses: initialCourses,
  meta,
  activeView,
  currentPage,
  initialSearch,
  error,
}: {
  stats: DashboardStats;
  courses: Course[];
  meta: Meta;
  activeView: CourseView;
  currentPage: number;
  initialSearch: string;
  error: string | null;
}) {
  const [dashboardStats, setDashboardStats] = useState(stats);
  const [view, setView] = useState<CourseView>(activeView);
  const [page, setPage] = useState(currentPage);
  const [search, setSearch] = useState(initialSearch);
  const [listMeta, setListMeta] = useState(meta);
  const [listError, setListError] = useState(error);
  const [isListLoading, setIsListLoading] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [courses, setCourses] = useState(() =>
    normalizeCourses(initialCourses, activeView),
  );
  const abortRef = useRef<AbortController | null>(null);
  const viewRef = useRef(activeView);
  const searchDidMountRef = useRef(false);

  const loadCourses = useCallback(
    async (nextView: CourseView, nextPage: number, nextSearch: string) => {
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      setIsListLoading(true);
      setListError(null);

      try {
        const res = await fetch(buildApiUrl(nextView, nextPage, nextSearch), {
          signal: controller.signal,
        });

        if (res.status === 401) {
          window.location.href = "/logout?callbackUrl=/dashboard/courses";
          return;
        }

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(json?.message || "Unable to load courses.");
        }

        const nextCourses = Array.isArray(json?.data) ? (json.data as Course[]) : [];

        setCourses(normalizeCourses(nextCourses, nextView));
        setListMeta((current) => mergeMeta(current, json?.meta, nextPage));
        if (
          nextView === "SAVED" &&
          typeof json?.meta?.total_items === "number"
        ) {
          setDashboardStats((current) => ({
            ...current,
            bookmarked_courses: json.meta.total_items,
          }));
        }
        viewRef.current = nextView;
        setView(nextView);
        setPage(nextPage);
        window.history.replaceState(
          null,
          "",
          buildBrowserHref(nextView, nextPage, nextSearch),
        );
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }

        setListError(
          caught instanceof Error
            ? caught.message
            : "Unable to load courses right now.",
        );
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsListLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!searchDidMountRef.current) {
      searchDidMountRef.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      loadCourses(viewRef.current, 1, search);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [loadCourses, search]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const counts = {
    ALL: dashboardStats.total_courses_enrolled,
    IN_PROGRESS: dashboardStats.in_process_courses,
    NOT_STARTED: dashboardStats.not_started_courses,
    COMPLETED: dashboardStats.completed_courses,
    SAVED: dashboardStats.bookmarked_courses,
  };

  function toggleBookmark(course: DisplayCourse) {
    const nextBookmarked = !course.bookmarked;
    const bookmarkDelta = nextBookmarked ? 1 : -1;
    setPendingCourseId(course.id);
    setDashboardStats((current) => updateBookmarkedStat(current, bookmarkDelta));

    setCourses((current) =>
      current.map((item) =>
        item.id === course.id ? { ...item, bookmarked: nextBookmarked } : item,
      ),
    );

    if (view === "SAVED" && !nextBookmarked) {
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setListMeta((current) => updateSavedMeta(current, bookmarkDelta));
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/proxy/courses/${course.id}/bookmark`, {
          method: nextBookmarked ? "POST" : "DELETE",
        });

        if (!res.ok) throw new Error("Bookmark update failed");
      } catch {
        setDashboardStats((current) =>
          updateBookmarkedStat(current, -bookmarkDelta),
        );
        setCourses((current) =>
          current.map((item) =>
            item.id === course.id
              ? { ...item, bookmarked: !nextBookmarked }
              : item,
          ),
        );
        if (view === "SAVED" && !nextBookmarked) {
          setListMeta((current) => updateSavedMeta(current, -bookmarkDelta));
          setCourses((current) => [
            { ...course, bookmarked: true, is_bookmarked: true },
            ...current,
          ]);
        }
      } finally {
        setPendingCourseId(null);
      }
    });
  }

  const showingStart = courses.length
    ? (listMeta.page - 1) * listMeta.page_size + 1
    : 0;
  const showingEnd = courses.length ? showingStart + courses.length - 1 : 0;
  const totalItems = listMeta.total_items || courses.length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            My Courses
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            View and manage all your enrolled learning in one place.
          </p>
        </div>
        <Link
          href="/dashboard/course-catalogue"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d8cffa] bg-white px-4 text-sm font-bold text-[#4c2db8] no-underline shadow-sm transition hover:bg-[#f6f2ff] dark:border-[#3d3271] dark:bg-[#121527] dark:text-[#c9bbff] dark:hover:bg-[#211a42]"
        >
          <BookOpen className="h-4 w-4" />
          Explore Courses
        </Link>
      </div>

      {listError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {listError}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={dashboardStats.total_courses_enrolled}
          action="View all"
          tone="purple"
          onSelect={() => loadCourses("ALL", 1, search)}
        />
        <StatsCard
          icon={CirclePlay}
          label="In Progress"
          value={dashboardStats.in_process_courses}
          action="View courses"
          tone="orange"
          onSelect={() => loadCourses("IN_PROGRESS", 1, search)}
        />
        <StatsCard
          icon={BadgeCheck}
          label="Completed"
          value={dashboardStats.completed_courses}
          action="View certificates"
          tone="green"
          onSelect={() => loadCourses("COMPLETED", 1, search)}
        />
        <StatsCard
          icon={Bookmark}
          label="Saved"
          value={dashboardStats.bookmarked_courses}
          action="View saved"
          tone="pink"
          onSelect={() => loadCourses("SAVED", 1, search)}
        />
      </section>

      <section className="rounded-md border border-[#e5e3ee] bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
        <div className="flex flex-col gap-3 border-b border-[#eceaf4] px-3 py-3 dark:border-[#262a3d] lg:flex-row lg:items-center lg:justify-between">
          <div className="swcl-sidebar-scroll -mb-3 flex gap-1 overflow-x-auto pb-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => loadCourses(tab.key, 1, search)}
                className={`relative flex h-10 flex-shrink-0 items-center gap-2 px-4 text-sm font-extrabold transition ${
                  view === tab.key
                    ? "text-[#4c2db8] dark:text-[#c9bbff]"
                    : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  {counts[tab.key]}
                </span>
                {view === tab.key && (
                  <span className="absolute inset-x-2 -bottom-3 h-0.5 rounded-full bg-[#5b2dcc]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative block min-w-0 sm:w-[320px]">
              <label>
                <span className="sr-only">Search my courses</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  type="search"
                  autoComplete="off"

                  placeholder="Search my courses..."
                  className="h-10 w-full rounded-md border border-[#dedcea] bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5b2dcc] focus:ring-4 focus:ring-[#5b2dcc]/10 dark:border-[#2b3044] dark:bg-[#0f1726] dark:text-slate-100 dark:focus:border-[#8f79ff]"
                />
              </label>
              {isListLoading && (
                <span className="absolute right-3 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#5b2dcc]" />
              )}
            </div>
          </div>
        </div>

        {courses.length ? (
          <>
            <div
              className={`grid gap-4 p-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${
                isListLoading ? "opacity-60" : "opacity-100"
              }`}
            >
              {courses.map((course, index) => (
                <DashboardCourseCard
                  key={course.id}
                  course={course}
                  image={course.thumbnail_url || fallbackImages[index % fallbackImages.length]}
                  savedOnly={view === "SAVED"}
                  pending={isPending && pendingCourseId === course.id}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#eceaf4] px-4 py-4 dark:border-[#262a3d] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-sm font-medium text-slate-600 dark:text-slate-400 sm:text-left">
                Showing {showingStart} to {showingEnd} of {totalItems} courses
              </p>
              <Pagination
                currentPage={page}
                disabled={isListLoading}
                meta={listMeta}
                onPageChange={(nextPage) => loadCourses(view, nextPage, search)}
              />
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-md bg-[#f2edff] text-[#5b2dcc] dark:bg-[#5b2dcc]/20 dark:text-[#c9bbff]">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              No courses found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              Try another tab or search term. Enrolled and saved courses will
              appear here as soon as the API returns them.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function StatsCard({
  icon: Icon,
  label,
  value,
  action,
  tone,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number;
  action: string;
  tone: "purple" | "orange" | "green" | "pink";
  onSelect: () => void;
}) {
  const tones = {
    purple:
      "bg-[#eee8ff] text-[#5b2dcc] dark:bg-[#5b2dcc]/20 dark:text-[#c9bbff]",
    orange:
      "bg-[#fff0cf] text-[#f08b13] dark:bg-[#f08b13]/18 dark:text-[#ffc46b]",
    green:
      "bg-[#dcf7e8] text-[#15945a] dark:bg-[#15945a]/18 dark:text-[#8de5b5]",
    pink: "bg-[#ffe1ed] text-[#f43f7f] dark:bg-[#f43f7f]/18 dark:text-[#ff9abb]",
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-h-[112px] items-center gap-4 rounded-md border border-[#e5e3ee] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#cfc7ef] hover:shadow-md dark:border-[#262a3d] dark:bg-[#111525] dark:hover:border-[#4a426e]"
    >
      <span
        className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${tones[tone]}`}
      >
        <Icon className="h-8 w-8" strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-slate-950 dark:text-white">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-extrabold leading-none text-slate-950 dark:text-white">
          {Number(value || 0).toLocaleString()}
        </span>
        <span className="mt-2 block text-sm font-bold text-[#4c2db8] group-hover:underline dark:text-[#c9bbff]">
          {action}
        </span>
      </span>
    </button>
  );
}

function Pagination({
  currentPage,
  disabled,
  meta,
  onPageChange,
}: {
  currentPage: number;
  disabled: boolean;
  meta: Meta;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, meta.total_pages || 1);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return start + index;
  }).filter((page) => page >= 1 && page <= totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Course pages">
      <PageButton
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={disabled || !meta.has_previous}
        label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageButton>
      {pages.map((page) => (
        <PageButton
          key={page}
          onClick={() => onPageChange(page)}
          active={page === currentPage}
          disabled={disabled}
          label={`Page ${page}`}
        >
          {page}
        </PageButton>
      ))}
      {totalPages > 5 && currentPage < totalPages - 2 && (
        <span className="flex h-9 w-9 items-center justify-center text-sm font-bold text-slate-500">
          ...
        </span>
      )}
      {totalPages > 5 && !pages.includes(totalPages) && (
        <PageButton
          onClick={() => onPageChange(totalPages)}
          disabled={disabled}
          label={`Page ${totalPages}`}
        >
          {totalPages}
        </PageButton>
      )}
      <PageButton
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={disabled || !meta.has_next}
        label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageButton>
    </nav>
  );
}

function PageButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = `flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-extrabold no-underline transition ${
    active
      ? "border-[#5b2dcc] bg-[#5b2dcc] text-white dark:border-[#8f79ff] dark:bg-[#8f79ff] dark:text-[#111525]"
      : disabled
        ? "pointer-events-none border-[#eceaf4] bg-slate-50 text-slate-300 dark:border-[#262a3d] dark:bg-[#0f1726] dark:text-slate-700"
        : "border-[#dedcea] bg-white text-slate-700 hover:border-[#9b86e8] hover:bg-[#f7f4ff] hover:text-[#4c2db8] dark:border-[#2b3044] dark:bg-[#0f1726] dark:text-slate-300 dark:hover:border-[#6f5cc7] dark:hover:bg-[#211a42] dark:hover:text-[#d7ceff]"
  }`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={className}
    >
      {children}
    </button>
  );
}

function DashboardCourseCard({
  course,
  image,
  savedOnly,
  pending,
  onToggleBookmark,
}: {
  course: DisplayCourse;
  image: string;
  savedOnly: boolean;
  pending: boolean;
  onToggleBookmark: (course: DisplayCourse) => void;
}) {
  const instructor = getInstructor(course);
  const accessDate = formatDate(course.access_end_date);
  const completionDate = formatDate(course.updated_at);
  const status = course.displayStatus;
  const isComplete = status === "COMPLETED";
  const isStarted = status === "IN_PROGRESS";
  const label = actionLabel(status, savedOnly, course.wishlist);
  const durationLabel = getCourseDurationLabel(course);
  const hasCertificate = course.certificate_enabled === true;

  return (
    <article className="group flex min-h-[366px] flex-col overflow-hidden rounded-md border border-[#e5e3ee] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9c1eb] hover:shadow-lg dark:border-[#262a3d] dark:bg-[#0f1726]">
      <Link
        href={actionHref(course)}
        className="relative block aspect-[16/6.8] overflow-hidden bg-slate-100 dark:bg-slate-800"
      >
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span
            className={`rounded-md px-2.5 py-1 text-xs font-extrabold shadow-sm ${statusClasses(status, course.wishlist)}`}
          >
            {course.wishlist ? "Wishlist" : formatStatus(status)}
          </span>
          {course.has_new_content && !course.wishlist && (
            <span className="rounded-md bg-[#f08b13] px-2.5 py-1 text-xs font-extrabold text-white shadow-sm">
              New content
            </span>
          )}
        </div>
        {course.bookmarked && !course.wishlist && (
          <span className="absolute left-3 top-3 inline-flex h-8 items-center gap-1 rounded-md bg-[#f43f7f] px-2.5 text-xs font-extrabold text-white shadow-sm">
            <Bookmark className="h-3.5 w-3.5 fill-current" />
            Saved
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-2 min-h-10 text-base font-extrabold leading-5 text-slate-950 dark:text-white">
              <Link
                href={actionHref(course)}
                className="no-underline transition hover:text-[#4c2db8] dark:hover:text-[#c9bbff]"
              >
                {course.title}
              </Link>
            </h2>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {course.description || "Professional social work practice"}
            </p>
          </div>
          <button
            type="button"
            aria-label={`More actions for ${course.title}`}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <EllipsisVertical className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex min-w-0 items-center gap-2">
          {instructor.avatar_url ? (
            <img
              src={instructor.avatar_url}
              alt=""
              className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#ffe6d2] text-xs font-extrabold text-[#a24b17] dark:bg-[#a24b17]/25 dark:text-[#ffbd8f]">
              {instructor.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 truncate text-sm font-medium text-slate-600 dark:text-slate-300">
            {instructor.name}
          </span>
        </div>

        {durationLabel && (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#f0fbf5] px-2.5 py-1 text-xs font-extrabold text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <Clock3 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{durationLabel}</span>
            </span>
            {hasCertificate && (
              <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#ecfff4] px-2.5 py-1 text-xs font-extrabold text-[#0f8a46] dark:bg-[#15945a]/15 dark:text-[#8de5b5]">
                <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">Certificate</span>
              </span>
            )}
          </div>
        )}
        {!durationLabel && hasCertificate && (
          <div className="mb-4 flex">
            <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#ecfff4] px-2.5 py-1 text-xs font-extrabold text-[#0f8a46] dark:bg-[#15945a]/15 dark:text-[#8de5b5]">
              <Trophy className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">Certificate</span>
            </span>
          </div>
        )}

        <div className="mt-auto">
          {course.wishlist ? (
            <div className="mb-4 rounded-md border border-[#ffd1e1] bg-[#fff3f8] px-3 py-2 text-xs font-bold text-[#b91d57] dark:border-[#f43f7f]/30 dark:bg-[#f43f7f]/10 dark:text-[#ff9abb]">
              Saved for later. Enroll to start learning.
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${
                    isComplete ? "bg-[#12a150]" : "bg-[#5b2dcc]"
                  }`}
                  style={{ width: `${course.displayProgress}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs font-bold text-slate-600 dark:text-slate-300">
                {status === "NOT_STARTED"
                  ? "Not started"
                  : `${course.displayProgress}%`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#12a150]" />
              ) : course.wishlist ? (
                <Bookmark className="h-4 w-4 flex-shrink-0 fill-current text-[#f43f7f]" />
              ) : (
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">
                {course.wishlist
                  ? "Wishlist course"
                  : isComplete
                  ? `Completed${completionDate ? ` on ${completionDate}` : ""}`
                  : accessDate
                    ? `Access until ${accessDate}`
                    : "Access active"}
              </span>
            </span>

            <div className="flex flex-shrink-0 items-center gap-2">
              <Link
                href={actionHref(course)}
                className={`inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-extrabold no-underline transition ${
                  course.wishlist
                    ? "border-[#f43f7f] text-[#d82d69] hover:bg-[#fff3f8] dark:border-[#f43f7f]/60 dark:text-[#ff9abb] dark:hover:bg-[#f43f7f]/12"
                    : isComplete
                    ? "border-[#12a150] text-[#0f8a46] hover:bg-[#ecfff4] dark:border-[#24c66c] dark:text-[#8de5b5] dark:hover:bg-[#15945a]/15"
                    : isStarted
                      ? "border-[#9b86e8] bg-[#f7f4ff] text-[#4c2db8] hover:bg-[#efe9ff] dark:border-[#6f5cc7] dark:bg-[#211a42] dark:text-[#d7ceff] dark:hover:bg-[#2b2257]"
                      : "border-[#9b86e8] text-[#4c2db8] hover:bg-[#f7f4ff] dark:border-[#6f5cc7] dark:text-[#d7ceff] dark:hover:bg-[#211a42]"
                }`}
              >
                {label}
              </Link>
              {isComplete && hasCertificate && !course.wishlist && (
                <Link
                  href={`/dashboard/certificates/${course.id}`}
                  aria-label={`View certificate for ${course.title}`}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-[#12a150] text-[#0f8a46] transition hover:bg-[#ecfff4] dark:border-[#24c66c] dark:text-[#8de5b5] dark:hover:bg-[#15945a]/15"
                >
                  <Award className="h-4 w-4" />
                </Link>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => onToggleBookmark(course)}
                aria-label={
                  course.bookmarked
                    ? `Remove ${course.title} from saved courses`
                    : `Save ${course.title}`
                }
                className={`flex h-9 w-9 items-center justify-center rounded-md border transition disabled:cursor-wait disabled:opacity-70 ${
                  course.bookmarked
                    ? "border-[#f43f7f] bg-[#f43f7f] text-white hover:bg-[#df2c6c]"
                    : "border-[#d8cffa] text-[#5b2dcc] hover:bg-[#f7f4ff] dark:border-[#4a426e] dark:text-[#c9bbff] dark:hover:bg-[#211a42]"
                }`}
              >
                <Bookmark
                  className={`h-4 w-4 ${course.bookmarked ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
