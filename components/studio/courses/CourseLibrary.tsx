"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  LayoutGrid,
  List,
  Lock,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  X,
} from "lucide-react";
import {
  Button,
  ButtonLink,
  Callout,
  EmptyState,
  Input,
  PageHeader,
  Segmented,
  Select,
  cn,
} from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { useAccess } from "@/components/studio/AccessContext";
import { ApiError, studioApi } from "@/lib/studio/api";
import { CATEGORY_LABELS, LEVEL_LABELS } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { ApprovalRow, CourseCategory, CourseLevel, ManagedCourse, Paginated } from "@/lib/studio/types";
import { CourseCard, CourseCardSkeleton, type CourseView } from "./CourseCard";
import { courseLifecycle, revisionMapFromRows, revisionPill } from "./courseStatus";

type StatusFilter = "all" | "drafts" | "live" | "archived" | "attention";
type SortKey = "recent" | "title";

const PAGE_SIZE = 50;
const VIEW_KEY = "studio.courses.view";

export type CourseLibraryProps = {
  initialCourses: Paginated<ManagedCourse> | null;
  initialDrafts: ApprovalRow[] | null;
  initialReturned: ApprovalRow[] | null;
};

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/* Grid/list preference, remembered per browser. */
const viewListeners = new Set<() => void>();
let sessionView: CourseView | null = null;
function readStoredView(): CourseView {
  if (sessionView) return sessionView;
  try {
    return window.localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}
function storeView(v: CourseView) {
  sessionView = v;
  try {
    window.localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* storage unavailable */
  }
  viewListeners.forEach((l) => l());
}
function useStoredView() {
  return useSyncExternalStore(
    (cb) => {
      viewListeners.add(cb);
      return () => viewListeners.delete(cb);
    },
    readStoredView,
    () => "grid" as CourseView,
  );
}

export function CourseLibrary({ initialCourses, initialDrafts, initialReturned }: CourseLibraryProps) {
  const { capabilities, governanceEnabled } = useAccess();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounced(searchInput.trim(), 350);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [category, setCategory] = useState<CourseCategory | "">("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<ManagedCourse | null>(null);
  const [lazyStatus, setLazyStatus] = useState<Record<string, string | null>>({});

  const view = useStoredView();
  // Reset to page 1 whenever the server-side filters change.
  const filterSig = `${search}|${level}|${category}|${status}`;
  const [lastSig, setLastSig] = useState(filterSig);
  if (filterSig !== lastSig) {
    setLastSig(filterSig);
    setPage(1);
  }

  const isPublished = status === "live" ? true : status === "drafts" || status === "archived" ? false : undefined;
  const params = {
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    level: level || undefined,
    category: category || undefined,
    is_published: governanceEnabled ? undefined : isPublished,
  };
  const isDefault = page === 1 && !search && !level && !category && params.is_published === undefined;

  const coursesQuery = useQuery({
    queryKey: qk.courses(params),
    queryFn: () => studioApi.listCourses(params),
    initialData: isDefault && initialCourses ? initialCourses : undefined,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled: !!capabilities.can_edit_content,
  });

  const draftsQuery = useQuery({
    queryKey: qk.approval("my_drafts", "COURSE_REVISION"),
    queryFn: () => studioApi.approvalCentre({ view: "my_drafts", kind: "COURSE_REVISION", page_size: 100 }).then((r) => r.items),
    initialData: initialDrafts ?? undefined,
    staleTime: 60_000,
    enabled: governanceEnabled && !!capabilities.can_access_approval_centre,
  });
  const returnedQuery = useQuery({
    queryKey: qk.approval("returned_to_me", "COURSE_REVISION"),
    queryFn: () =>
      studioApi.approvalCentre({ view: "returned_to_me", kind: "COURSE_REVISION", page_size: 100 }).then((r) => r.items),
    initialData: initialReturned ?? undefined,
    staleTime: 60_000,
    enabled: governanceEnabled && !!capabilities.can_access_approval_centre,
  });

  const revisionMap = useMemo(
    () => revisionMapFromRows(draftsQuery.data, returnedQuery.data),
    [draftsQuery.data, returnedQuery.data],
  );

  const onRevisionResolved = useCallback((courseId: string, s: string | null) => {
    setLazyStatus((prev) => (prev[courseId] === s ? prev : { ...prev, [courseId]: s }));
  }, []);

  const allCourses = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data]);
  const visible = useMemo(() => {
    const filtered = allCourses.filter((c) => {
      const lc = courseLifecycle(c, governanceEnabled);
      if (status === "drafts") return lc === "DRAFT";
      if (status === "live") return lc === "PUBLISHED";
      if (status === "archived") return lc === "ARCHIVED";
      if (status === "attention") {
        const st = revisionMap[c.id]?.status ?? lazyStatus[c.id];
        return !!revisionPill(st, lc)?.attention;
      }
      return true;
    });
    const sorted = [...filtered];
    if (sort === "title") sorted.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", undefined, { sensitivity: "base" }));
    else sorted.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return sorted;
  }, [allCourses, status, sort, governanceEnabled, revisionMap, lazyStatus]);

  const attentionCount = useMemo(
    () =>
      allCourses.filter((c) => !!revisionPill(revisionMap[c.id]?.status ?? lazyStatus[c.id], courseLifecycle(c, governanceEnabled))?.attention)
        .length,
    [allCourses, revisionMap, lazyStatus, governanceEnabled],
  );

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await studioApi.deleteCourse(toDelete.id);
      toast.success(`"${toDelete.title}" was deleted`);
      await queryClient.invalidateQueries({ queryKey: ["studio", "courses"] });
    } catch (e) {
      toast.error(e instanceof ApiError || e instanceof Error ? e.message : "Couldn't delete the course");
      throw e;
    }
  }

  const filtersActive = !!(searchInput || level || category || status !== "all");
  function clearFilters() {
    setSearchInput("");
    setLevel("");
    setCategory("");
    setStatus("all");
  }

  const meta = coursesQuery.data?.meta;
  const newCourse = capabilities.can_create_courses ? (
    <ButtonLink href="/dashboard/courses/new" icon={Plus}>
      New course
    </ButtonLink>
  ) : null;

  if (!capabilities.can_edit_content) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader eyebrow="Workspace" title="My courses" />
        <EmptyState
          icon={Lock}
          title="Course editing isn't part of your role"
          description="Your account can't create or edit course content. If you think that's a mistake, ask a platform administrator to review your roles."
          action={<ButtonLink href="/dashboard" variant="outline">Back to dashboard</ButtonLink>}
        />
      </div>
    );
  }

  const statusOptions: { key: StatusFilter; label: React.ReactNode }[] = [
    { key: "all", label: "All" },
    { key: "drafts", label: "Drafts" },
    { key: "live", label: "Live" },
    { key: "archived", label: "Archived" },
  ];
  if (governanceEnabled) {
    statusOptions.push({
      key: "attention",
      label: (
        <span className="inline-flex items-center gap-1.5">
          Needs attention
          {attentionCount > 0 && (
            <span className="min-w-[18px] rounded-full bg-amber-500 px-1 text-center text-[10px] font-bold leading-[18px] text-white">
              {attentionCount}
            </span>
          )}
        </span>
      ),
    });
  }

  const totalLabel =
    meta?.total_items !== undefined
      ? `${meta.total_items} course${meta.total_items === 1 ? "" : "s"}`
      : `${allCourses.length} course${allCourses.length === 1 ? "" : "s"}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="My courses"
        description={
          governanceEnabled
            ? "Build and improve your courses. Changes stay private until they've been reviewed and published."
            : "Build and improve your courses, then publish them when they're ready for learners."
        }
        actions={newCourse}
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Input
              type="search"
              aria-label="Search courses"
              placeholder="Search by title or description"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leading={<Search className="h-4 w-4" strokeWidth={2} />}
              className="pr-9"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchInput("")}
                className="absolute inset-y-0 right-2 my-auto grid h-6 w-6 cursor-pointer place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value as CourseCategory | "")} className="sm:w-48">
              <option value="">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by level" value={level} onChange={(e) => setLevel(e.target.value as CourseLevel | "")} className="sm:w-36">
              <option value="">All levels</option>
              {Object.entries(LEVEL_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
            <Select aria-label="Sort courses" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sm:w-44">
              <option value="recent">Recently created</option>
              <option value="title">Title A–Z</option>
            </Select>
            <Segmented
              size="md"
              value={view}
              onChange={storeView}
              options={[
                { key: "grid", label: <span className="sr-only">Grid view</span>, icon: LayoutGrid },
                { key: "list", label: <span className="sr-only">List view</span>, icon: List },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-1 max-w-full overflow-x-auto px-1">
            <Segmented size="sm" value={status} onChange={setStatus} options={statusOptions} />
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {coursesQuery.isFetching && !coursesQuery.isLoading ? <span>Updating…</span> : <span>{totalLabel}</span>}
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="cursor-pointer font-semibold text-brand-700 hover:underline dark:text-brand-300">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {coursesQuery.isError && !coursesQuery.data ? (
        <Callout
          tone="danger"
          icon={AlertTriangle}
          title="We couldn't load your courses"
          actions={
            <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => coursesQuery.refetch()} loading={coursesQuery.isFetching}>
              Try again
            </Button>
          }
        >
          {coursesQuery.error instanceof Error ? coursesQuery.error.message : "Please check your connection and try again."}
        </Callout>
      ) : coursesQuery.isLoading ? (
        <CourseGrid view={view}>
          {Array.from({ length: view === "grid" ? 6 : 5 }).map((_, i) => (
            <CourseCardSkeleton key={i} view={view} />
          ))}
        </CourseGrid>
      ) : allCourses.length === 0 && !filtersActive ? (
        <EmptyState
          icon={BookOpen}
          title="You haven't created a course yet"
          description={
            capabilities.can_create_courses
              ? "Start with the basics — a title, a short description and who it's for. You can build the curriculum next."
              : "Courses you're invited to work on will appear here."
          }
          action={
            capabilities.can_create_courses ? (
              <ButtonLink href="/dashboard/courses/new" icon={Plus} size="lg">
                Create your first course
              </ButtonLink>
            ) : undefined
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          compact
          title={status === "attention" ? "Nothing needs your attention" : "No courses match"}
          description={
            status === "attention"
              ? "No courses have requested changes or unsubmitted edits right now."
              : "Try a different search or clear the filters."
          }
          action={
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className={cn("transition-opacity", coursesQuery.isPlaceholderData && "opacity-60")}>
          <CourseGrid view={view}>
            {visible.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                view={view}
                governanceEnabled={governanceEnabled}
                knownRevision={revisionMap[c.id]}
                onDelete={setToDelete}
                onRevisionResolved={onRevisionResolved}
              />
            ))}
          </CourseGrid>
        </div>
      )}

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page {meta.page} of {meta.total_pages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={ArrowLeft} disabled={!meta.has_previous} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" iconRight={ArrowRight} disabled={!meta.has_next} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this course?"
        description={
          toDelete ? (
            <>
              <span className="font-semibold text-slate-700 dark:text-slate-200">“{toDelete.title}”</span> and everything in it
              will be removed. It has never been published, so no learners are affected. This can&apos;t be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete course"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function CourseGrid({ view, children }: { view: CourseView; children: React.ReactNode }) {
  return (
    <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-2.5"}>{children}</div>
  );
}
