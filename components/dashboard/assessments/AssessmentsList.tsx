"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  Filter,
  Layers,
  MoreVertical,
  PlayCircle,
  RotateCcw,
  Search,
  TimerReset,
} from "lucide-react";

export type AssessmentTab =
  | "upcoming"
  | "submitted"
  | "results"
  | "completed"
  | "retakes";

export type AssessmentStats = {
  upcoming_count: number;
  completed_count: number;
  average_score_percentage: number | null;
  retakes_available_count: number;
};

export type AssessmentDateRange = {
  startDate: string;
  endDate: string;
  label: string;
};

export type UserAssessment = {
  item_id: string;
  title: string;
  course_id: string;
  course_title: string;
  assessment_type: "QUIZ" | "ESSAY" | "QUIZ_GROUP" | string;
  due_date: string | null;
  status: string;
  score: number | null;
  last_activity_at: string | null;
  estimated_minutes?: number | null;
  max_attempts?: number | null;
  attempts_used?: number | null;
  attempts_remaining?: number | null;
  pass_mark_percentage?: number | null;
  is_graded?: boolean | null;
  is_published?: boolean | null;
};

const TABS: { id: AssessmentTab; label: string }[] = [
  { id: "completed", label: "Completed" },
  { id: "upcoming", label: "Upcoming" },
  { id: "submitted", label: "Submitted" },
  { id: "results", label: "Results" },
  { id: "retakes", label: "Retakes" },
];

const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  NOT_STARTED: {
    label: "Upcoming",
    className:
      "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-400/10 dark:text-violet-200 dark:border-violet-400/20",
  },
  SUBMITTED: {
    label: "Submitted",
    className:
      "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:border-amber-400/20",
  },
  PASSED: {
    label: "Completed",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-400/20",
  },
  GRADED: {
    label: "Graded",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-400/20",
  },
  FAILED: {
    label: "Requires Retake",
    className:
      "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-400/10 dark:text-rose-200 dark:border-rose-400/20",
  },
};

export default function AssessmentsList({
  assessments,
  stats,
  upcomingAssessments,
  completedAssessments,
  totalItems,
  totalPages,
  currentPage,
  currentTab,
  pageSize,
  assessmentType,
  dateRange,
  error,
}: {
  assessments: UserAssessment[];
  stats: AssessmentStats;
  upcomingAssessments: UserAssessment[];
  completedAssessments: UserAssessment[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  currentTab: AssessmentTab;
  pageSize: number;
  assessmentType: "QUIZ" | "ESSAY" | "QUIZ_GROUP" | null;
  dateRange: AssessmentDateRange | null;
  error: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleAssessments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base =
      currentTab === "results"
        ? assessments.filter((assessment) =>
            ["PASSED", "FAILED", "GRADED"].includes(
              assessment.status?.toUpperCase(),
            ),
          )
        : assessments;

    if (!normalizedQuery) return base;

    return base.filter((assessment) =>
      [assessment.title, assessment.course_title, assessment.assessment_type]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [assessments, currentTab, query]);

  const calendarItems = useMemo(
    () => mergeByItemId([...upcomingAssessments, ...completedAssessments]),
    [upcomingAssessments, completedAssessments],
  );

  const showingStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(currentPage * pageSize, totalItems);

  function updateParam(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/dashboard/assessments?${params.toString()}`);
  }

  function changeTab(tab: AssessmentTab) {
    updateParam({ tab, page: "1" });
  }

  function changePage(page: number) {
    if (page < 1 || page > Math.max(totalPages, 1)) return;
    updateParam({ page: String(page) });
  }

  function clearDateRange() {
    updateParam({ start_date: null, end_date: null, page: "1" });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1540px] flex-col gap-5 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-normal text-slate-950 dark:text-white sm:text-3xl">
          Assessments
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Manage upcoming, completed and graded assessments.
        </p>
        {dateRange && (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-[#d9d4e8] bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm dark:border-[#30364d] dark:bg-[#111525] dark:text-slate-200">
            <CalendarDays className="h-4 w-4 flex-shrink-0 text-[#4f2ccf] dark:text-[#b9a8ff]" />
            <span className="min-w-0 truncate">
              Showing assessments due on {dateRange.label}
            </span>
            <button
              type="button"
              onClick={clearDateRange}
              className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-extrabold text-[#4f2ccf] transition hover:bg-[#f6f3ff] dark:text-[#b9a8ff] dark:hover:bg-[#171d31]"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Upcoming Assessments"
          value={stats.upcoming_count}
          href="/dashboard/assessments?tab=upcoming"
          action="View upcoming"
          icon={<CalendarDays className="h-6 w-6" />}
          tone="violet"
        />
        <SummaryCard
          title="Completed"
          value={stats.completed_count}
          href="/dashboard/assessments?tab=completed"
          action="View completed"
          icon={<CheckCircle2 className="h-6 w-6" />}
          tone="emerald"
        />
        <SummaryCard
          title="Average Score"
          value={
            stats.average_score_percentage === null
              ? "-"
              : `${Math.round(stats.average_score_percentage)}%`
          }
          href="/dashboard/assessments?tab=results"
          action="View performance"
          icon={<BarChart3 className="h-6 w-6" />}
          tone="blue"
        />
        <SummaryCard
          title="Retakes Available"
          value={stats.retakes_available_count}
          href="/dashboard/assessments?tab=retakes"
          action="View retakes"
          icon={<RotateCcw className="h-6 w-6" />}
          tone="rose"
        />
      </section>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-[#e5e3ee] bg-white shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
          <div className="flex flex-col gap-3 border-b border-[#e8e6f0] px-4 py-3 dark:border-[#262a3d] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-5 overflow-x-auto swcl-sidebar-scroll">
              {TABS.map((tab) => {
                const active = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => changeTab(tab.id)}
                    className={`relative h-10 flex-shrink-0 px-1 text-sm font-extrabold transition-colors ${
                      active
                        ? "text-[#4f2ccf] dark:text-[#b9a8ff]"
                        : "text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                    {active && (
                      <span className="absolute inset-x-0 -bottom-3 h-0.5 rounded-full bg-[#5b2ed4]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,18rem)_auto] sm:items-center">
              <label className="relative block min-w-0">
                <span className="sr-only">Search assessments</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search assessments..."
                  className="h-10 w-full rounded-md border border-[#e1deec] bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#5b2ed4] focus:ring-4 focus:ring-[#5b2ed4]/10 dark:border-[#30364d] dark:bg-[#0f1726] dark:text-slate-100"
                />
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((value) => !value)}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#d9d4e8] bg-white px-3 text-sm font-extrabold text-[#4f2ccf] transition hover:bg-[#f6f3ff] dark:border-[#30364d] dark:bg-[#0f1726] dark:text-[#b9a8ff] dark:hover:bg-[#171d31] sm:w-auto"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </button>

                {filtersOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-[#e5e3ee] bg-white p-2 shadow-xl dark:border-[#262a3d] dark:bg-[#111525]">
                    <FilterOption
                      label="All types"
                      active={!assessmentType}
                      onClick={() => {
                        updateParam({ assessment_type: null, page: "1" });
                        setFiltersOpen(false);
                      }}
                    />
                    <FilterOption
                      label="Quizzes"
                      active={assessmentType === "QUIZ"}
                      onClick={() => {
                        updateParam({ assessment_type: "QUIZ", page: "1" });
                        setFiltersOpen(false);
                      }}
                    />
                    <FilterOption
                      label="Essays"
                      active={assessmentType === "ESSAY"}
                      onClick={() => {
                        updateParam({ assessment_type: "ESSAY", page: "1" });
                        setFiltersOpen(false);
                      }}
                    />
                    <FilterOption
                      label="Quiz Groups"
                      active={assessmentType === "QUIZ_GROUP"}
                      onClick={() => {
                        updateParam({ assessment_type: "QUIZ_GROUP", page: "1" });
                        setFiltersOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {error ? (
            <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto swcl-sidebar-scroll xl:block">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#e8e6f0] bg-[#fbfbfd] text-left text-xs font-extrabold text-slate-600 dark:border-[#262a3d] dark:bg-[#0f1726] dark:text-slate-400">
                      <th className="px-4 py-3">Assessment</th>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Rules</th>
                      <th className="px-4 py-3">Attempts</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleAssessments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-14 text-center text-sm font-semibold text-slate-500 dark:text-slate-400"
                        >
                          No assessments match this view.
                        </td>
                      </tr>
                    ) : (
                      visibleAssessments.map((assessment) => (
                        <AssessmentRow
                          key={assessment.item_id}
                          assessment={assessment}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 xl:hidden">
                {visibleAssessments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#d9d4e8] bg-[#fbfaff] px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:border-[#30364d] dark:bg-[#0f1726] dark:text-slate-400">
                    No assessments match this view.
                  </div>
                ) : (
                  visibleAssessments.map((assessment) => (
                    <MobileAssessmentCard
                      key={assessment.item_id}
                      assessment={assessment}
                    />
                  ))
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-[#e8e6f0] px-3 py-3 dark:border-[#262a3d] sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Showing {showingStart} to {showingEnd} of {totalItems}{" "}
                  assessments
                </p>

                <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-center sm:justify-between lg:justify-end">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changePage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e1deec] text-slate-600 transition hover:bg-[#f6f3ff] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#30364d] dark:text-slate-300 dark:hover:bg-[#171d31]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="flex h-9 min-w-9 items-center justify-center rounded-md bg-[#5b2ed4] px-3 text-sm font-extrabold text-white">
                      {currentPage}
                    </span>
                    <button
                      type="button"
                      onClick={() => changePage(currentPage + 1)}
                      disabled={currentPage >= Math.max(totalPages, 1)}
                      aria-label="Next page"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e1deec] text-slate-600 transition hover:bg-[#f6f3ff] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#30364d] dark:text-slate-300 dark:hover:bg-[#171d31]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <label className="flex items-center justify-between gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 sm:justify-start">
                    Rows per page
                    <select
                      value={pageSize}
                      onChange={(event) =>
                        updateParam({ rows: event.target.value, page: "1" })
                      }
                      className="h-9 rounded-md border border-[#e1deec] bg-white px-3 text-sm font-extrabold text-slate-800 outline-none dark:border-[#30364d] dark:bg-[#0f1726] dark:text-slate-100"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </label>
                </div>
              </div>
            </>
          )}
        </section>

        <aside className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:flex 2xl:flex-col">
          <AssessmentCalendar
            assessments={calendarItems}
            activeDateRange={dateRange}
            onSelectDate={(date, preferredTab) => {
              const nextRange = getDayRangeParams(date);
              updateParam({
                tab: preferredTab,
                start_date: nextRange.startDate,
                end_date: nextRange.endDate,
                page: "1",
              });
            }}
          />
          <SideList
            title="Upcoming Deadlines"
            href="/dashboard/assessments?tab=upcoming"
            items={upcomingAssessments.slice(0, 3)}
            empty="No upcoming deadlines."
          />
          <FeedbackList assessments={completedAssessments.slice(0, 3)} />
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  action,
  href,
  icon,
  tone,
}: {
  title: string;
  value: number | string;
  action: string;
  href: string;
  icon: React.ReactNode;
  tone: "violet" | "emerald" | "blue" | "rose";
}) {
  const tones = {
    violet:
      "bg-violet-100 text-[#5b2ed4] dark:bg-violet-400/15 dark:text-violet-200",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200",
  };

  return (
    <Link
      href={href}
      className="grid min-h-[116px] grid-cols-[56px_minmax(0,1fr)] items-center gap-4 rounded-lg border border-[#e5e3ee] bg-white p-4 text-slate-950 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-[#c7bdf4] hover:shadow-md dark:border-[#262a3d] dark:bg-[#111525] dark:text-white"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-full ${tones[tone]}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold">{title}</span>
        <span className="mt-1 block text-2xl font-extrabold">{value}</span>
        <span className="mt-1 block text-xs font-extrabold text-[#4f2ccf] dark:text-[#b9a8ff]">
          {action}
        </span>
      </span>
    </Link>
  );
}

function AssessmentRow({ assessment }: { assessment: UserAssessment }) {
  const href = `/learn/${assessment.course_id}/item/${assessment.item_id}`;
  const status = getStatusDisplay(assessment);

  return (
    <tr className="border-b border-[#eeeaf5] transition hover:bg-[#fbfaff] dark:border-[#262a3d] dark:hover:bg-[#151a2b]">
      <td className="px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <AssessmentIcon assessment={assessment} />
          <div className="min-w-0">
            <Link
              href={href}
              className="line-clamp-2 text-sm font-extrabold text-slate-950 no-underline hover:text-[#4f2ccf] dark:text-white dark:hover:text-[#b9a8ff]"
            >
              {assessment.title}
            </Link>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {getAssessmentMetaLabel(assessment)}
            </p>
          </div>
        </div>
      </td>
      <td className="max-w-[220px] px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
        <span className="line-clamp-2">{assessment.course_title}</span>
      </td>
      <td className="px-4 py-4 text-sm font-medium text-slate-800 dark:text-slate-200">
        {assessment.due_date ? (
          <span className="whitespace-nowrap">{formatDueDate(assessment.due_date)}</span>
        ) : (
          <span className="text-slate-400">No due date</span>
        )}
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-extrabold ${status.className}`}
        >
          {status.label}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-extrabold">
        {typeof assessment.score === "number" ? (
          <span
            className={
              assessment.status?.toUpperCase() === "FAILED"
                ? "text-rose-600 dark:text-rose-300"
                : "text-slate-950 dark:text-white"
            }
          >
            {Math.round(assessment.score)}%
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td className="px-4 py-4 text-sm font-extrabold text-slate-700 dark:text-slate-300">
        {getRulesLabel(assessment)}
      </td>
      <td className="px-4 py-4">
        <AttemptsSummary assessment={assessment} />
      </td>
      <td className="px-4 py-4">
        <AssessmentActionButton assessment={assessment} />
      </td>
      <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
        {assessment.last_activity_at ? (
          <span className="whitespace-nowrap">{formatShortDate(assessment.last_activity_at)}</span>
        ) : (
          <span className="text-slate-400">Not started</span>
        )}
      </td>
    </tr>
  );
}

function MobileAssessmentCard({ assessment }: { assessment: UserAssessment }) {
  const href = `/learn/${assessment.course_id}/item/${assessment.item_id}`;
  const status = getStatusDisplay(assessment);

  return (
    <article className="rounded-lg border border-[#eeeaf5] bg-white p-3 shadow-sm dark:border-[#262a3d] dark:bg-[#0f1726]">
      <div className="flex min-w-0 items-start gap-3">
        <AssessmentIcon assessment={assessment} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={href}
                className="line-clamp-2 text-sm font-extrabold leading-5 text-slate-950 no-underline hover:text-[#4f2ccf] dark:text-white dark:hover:text-[#b9a8ff]"
              >
                {assessment.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-slate-500 dark:text-slate-400">
                {assessment.course_title}
              </p>
            </div>
            <button
              type="button"
              aria-label={`More actions for ${assessment.title}`}
              className="-mr-1 -mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-md border px-2 py-1 text-xs font-extrabold ${status.className}`}
            >
              {status.label}
            </span>
            <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-600 dark:bg-white/10 dark:text-slate-300">
              {getAssessmentMetaLabel(assessment)}
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <MobileMetric
          label="Due Date"
          value={
            assessment.due_date ? formatDueDate(assessment.due_date) : "No due date"
          }
          fullWidth
        />
        <MobileMetric
          label="Score"
          value={
            typeof assessment.score === "number"
              ? `${Math.round(assessment.score)}%`
              : "-"
          }
          valueClassName={
            assessment.status?.toUpperCase() === "FAILED"
              ? "text-rose-600 dark:text-rose-300"
              : undefined
          }
        />
        <MobileMetric
          label="Pass Mark"
          value={getRulesLabel(assessment)}
        />
        <MobileMetric
          label="Attempts"
          value={formatAttempts(assessment)}
          fullWidth
        />
        <MobileMetric
          label="Last Activity"
          value={
            assessment.last_activity_at
              ? formatShortDate(assessment.last_activity_at)
              : "Not started"
          }
          fullWidth
        />
      </dl>

      <AssessmentActionButton assessment={assessment} fullWidth />
    </article>
  );
}

function AssessmentActionButton({
  assessment,
  fullWidth = false,
}: {
  assessment: UserAssessment;
  fullWidth?: boolean;
}) {
  const href = `/learn/${assessment.course_id}/item/${assessment.item_id}`;
  const action = getActionConfig(assessment);
  const Icon = action.icon;

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 text-sm font-extrabold no-underline shadow-sm ring-1 ring-inset transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111525] ${
        fullWidth ? "mt-3 h-10 w-full" : "h-9 min-w-[118px] whitespace-nowrap"
      } ${action.className}`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2.2} />
      <span>{action.label}</span>
    </Link>
  );
}

function AttemptsSummary({ assessment }: { assessment: UserAssessment }) {
  const type = assessment.assessment_type?.toUpperCase();

  if (type !== "QUIZ" && type !== "QUIZ_GROUP") {
    return (
      <span className="text-sm font-semibold text-slate-400">
        Not applicable
      </span>
    );
  }

  return (
    <div className="min-w-[112px]">
      <p className="whitespace-nowrap text-sm font-extrabold text-slate-800 dark:text-slate-100">
        {formatAttemptsUsed(assessment)}
      </p>
      <p className="mt-0.5 whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">
        {formatAttemptsRemaining(assessment)}
      </p>
    </div>
  );
}

function MobileMetric({
  label,
  value,
  valueClassName,
  fullWidth,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-md bg-[#fbfbfd] p-2 dark:bg-[#111525] ${
        fullWidth ? "col-span-2" : ""
      }`}
    >
      <dt className="text-[0.68rem] font-extrabold uppercase text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd
        className={`mt-1 min-w-0 break-words text-xs font-extrabold leading-4 text-slate-800 dark:text-slate-200 ${
          valueClassName || ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function AssessmentIcon({ assessment }: { assessment: UserAssessment }) {
  const status = assessment.status?.toUpperCase();
  const type = assessment.assessment_type?.toUpperCase();
  const failed = status === "FAILED";
  const completed = status === "PASSED" || status === "GRADED";
  const submitted = status === "SUBMITTED";

  let className =
    "bg-violet-100 text-[#5b2ed4] dark:bg-violet-400/15 dark:text-violet-200";
  let Icon = type === "ESSAY" ? FilePenLine : type === "QUIZ_GROUP" ? Layers : BookOpenCheck;

  if (completed) {
    className =
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200";
    Icon = CheckCircle2;
  } else if (failed) {
    className =
      "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200";
    Icon = TimerReset;
  } else if (submitted) {
    className =
      "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200";
    Icon = FilePenLine;
  }

  return (
    <span
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${className}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function AssessmentCalendar({
  assessments,
  activeDateRange,
  onSelectDate,
}: {
  assessments: UserAssessment[];
  activeDateRange: AssessmentDateRange | null;
  onSelectDate: (date: Date, preferredTab: AssessmentTab) => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = useMemo(() => {
    const firstDue = assessments.find((item) => item.due_date)?.due_date;
    return firstDue ? new Date(firstDue) : new Date();
  }, [assessments]);
  const monthDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + monthOffset,
    1,
  );
  const days = getCalendarDays(monthDate);
  const activeDateKey = activeDateRange
    ? toDateKey(activeDateRange.startDate)
    : null;
  const itemsByDate = useMemo(() => {
    const map = new Map<string, UserAssessment[]>();

    assessments.forEach((item) => {
      if (!item.due_date) return;

      const key = toDateKey(item.due_date);
      const items = map.get(key) || [];
      items.push(item);
      map.set(key, items);
    });

    return map;
  }, [assessments]);
  const dueSoonDates = new Set(
    assessments
      .filter((item) => {
        if (!item.due_date || item.status?.toUpperCase() !== "NOT_STARTED") {
          return false;
        }

        const due = new Date(item.due_date);
        const now = new Date();
        const twoDaysFromNow = new Date(now);
        twoDaysFromNow.setDate(now.getDate() + 2);

        return due <= twoDaysFromNow;
      })
      .map((item) => toDateKey(item.due_date as string)),
  );
  const dueThisWeekDates = new Set(
    assessments
      .filter((item) => {
        if (!item.due_date || item.status?.toUpperCase() !== "NOT_STARTED") {
          return false;
        }

        const due = new Date(item.due_date);
        const now = new Date();
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(now.getDate() + 7);

        return due >= now && due <= sevenDaysFromNow;
      })
      .map((item) => toDateKey(item.due_date as string)),
  );
  const completedDates = new Set(
    assessments
      .filter((item) =>
        ["PASSED", "FAILED", "GRADED", "SUBMITTED"].includes(
          item.status?.toUpperCase(),
        ),
      )
      .map((item) =>
        item.due_date
          ? toDateKey(item.due_date)
          : item.last_activity_at
            ? toDateKey(item.last_activity_at)
            : "",
      )
      .filter(Boolean),
  );

  function handleDateClick(date: Date) {
    const key = toDateKey(date);
    const itemsForDate = itemsByDate.get(key) || [];
    const hasUpcoming = itemsForDate.some(
      (item) => item.status?.toUpperCase() === "NOT_STARTED",
    );

    onSelectDate(date, hasUpcoming ? "upcoming" : "completed");
  }

  return (
    <section className="w-full rounded-lg border border-[#e5e3ee] bg-white p-4 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">
            Assessment Calendar
          </h2>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((value) => value - 1)}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#4f2ccf] transition hover:bg-[#f6f3ff] dark:text-[#b9a8ff] dark:hover:bg-[#171d31]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-extrabold text-slate-950 dark:text-white">
          {new Intl.DateTimeFormat("en-US", {
            month: "long",
            year: "numeric",
          }).format(monthDate)}
        </p>
        <button
          type="button"
          onClick={() => setMonthOffset((value) => value + 1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#4f2ccf] transition hover:bg-[#f6f3ff] dark:text-[#b9a8ff] dark:hover:bg-[#171d31]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-[320px] grid-cols-7 gap-1 text-center 2xl:max-w-none">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span
            key={day}
            className="py-1 text-xs font-extrabold text-slate-500 dark:text-slate-400"
          >
            {day}
          </span>
        ))}
        {days.map((day) => {
          const key = toDateKey(day.date);
          const isDue = dueSoonDates.has(key);
          const isDueThisWeek = dueThisWeekDates.has(key);
          const isComplete = completedDates.has(key);
          const isActive = activeDateKey === key;
          const itemsCount = itemsByDate.get(key)?.length || 0;
          return (
            <button
              key={`${key}-${day.inCurrentMonth}`}
              type="button"
              onClick={() => handleDateClick(day.date)}
              title={
                itemsCount
                  ? `${itemsCount} assessment${itemsCount === 1 ? "" : "s"} due`
                  : "Filter assessments by this date"
              }
              className={`relative flex h-9 w-9 items-center justify-center justify-self-center rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b2ed4] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#111525] ${
                isActive
                  ? "bg-slate-950 text-white ring-2 ring-[#5b2ed4] dark:bg-white dark:text-slate-950"
                  : isDue
                    ? "bg-[#5b2ed4] text-white hover:bg-[#4820b8]"
                    : isDueThisWeek
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-400/15 dark:text-amber-200"
                      : isComplete
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200"
                        : day.inCurrentMonth
                          ? "text-slate-700 hover:bg-[#f6f3ff] hover:text-[#4f2ccf] dark:text-slate-300 dark:hover:bg-[#171d31] dark:hover:text-[#b9a8ff]"
                          : "text-slate-400 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-white/5"
              }`}
            >
              {day.date.getDate()}
              {itemsCount > 0 && !isDue && !isComplete && !isDueThisWeek && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#5b2ed4]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
        <Legend color="bg-[#5b2ed4]" label={`Due soon (${dueSoonDates.size})`} />
        <Legend color="bg-amber-500" label="Due this week" />
        <Legend color="bg-emerald-500" label={`Completed (${completedDates.size})`} />
      </div>
    </section>
  );
}

function SideList({
  title,
  href,
  items,
  empty,
}: {
  title: string;
  href: string;
  items: UserAssessment[];
  empty: string;
}) {
  return (
    <section className="rounded-lg border border-[#e5e3ee] bg-white p-4 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">
          {title}
        </h2>
        <Link
          href={href}
          className="text-xs font-extrabold text-[#4f2ccf] no-underline dark:text-[#b9a8ff]"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-500 dark:bg-[#0f1726] dark:text-slate-400">
          {empty}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((item) => (
            <li key={item.item_id}>
              <Link
                href={`/learn/${item.course_id}/item/${item.item_id}`}
                className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 rounded-md p-1.5 text-slate-950 no-underline transition hover:bg-[#fbfaff] dark:text-white dark:hover:bg-[#151a2b]"
              >
                <AssessmentIcon assessment={item} />
                <span className="min-w-0">
                  <span className="line-clamp-1 text-sm font-extrabold">
                    {item.title}
                  </span>
                  <span className="line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {item.course_title}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    {item.due_date ? formatDueDate(item.due_date) : "No due date"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FeedbackList({ assessments }: { assessments: UserAssessment[] }) {
  return (
    <section className="rounded-lg border border-[#e5e3ee] bg-white p-4 shadow-sm dark:border-[#262a3d] dark:bg-[#111525]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-950 dark:text-white">
          Recent Feedback
        </h2>
        <Link
          href="/dashboard/assessments?tab=results"
          className="text-xs font-extrabold text-[#4f2ccf] no-underline dark:text-[#b9a8ff]"
        >
          View all
        </Link>
      </div>

      {assessments.length === 0 ? (
        <p className="rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-500 dark:bg-[#0f1726] dark:text-slate-400">
          Published scores and feedback will appear here.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {assessments.map((assessment) => (
            <li
              key={assessment.item_id}
              className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 rounded-md p-1.5"
            >
              <AssessmentIcon assessment={assessment} />
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/learn/${assessment.course_id}/item/${assessment.item_id}`}
                    className="line-clamp-1 text-sm font-extrabold text-slate-950 no-underline hover:text-[#4f2ccf] dark:text-white dark:hover:text-[#b9a8ff]"
                  >
                    {assessment.title}
                  </Link>
                  {typeof assessment.score === "number" && (
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-extrabold ${
                        assessment.status?.toUpperCase() === "FAILED"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"
                      }`}
                    >
                      {Math.round(assessment.score)}%
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {assessment.last_activity_at
                    ? `Reviewed on ${formatShortDate(assessment.last_activity_at)}`
                    : "Review status available"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs italic text-slate-600 dark:text-slate-300">
                  {getFeedbackPreview(assessment)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-[#f6f3ff] dark:text-slate-200 dark:hover:bg-[#171d31]"
    >
      {label}
      {active && <Check className="h-4 w-4 text-[#4f2ccf] dark:text-[#b9a8ff]" />}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function getStatusDisplay(assessment: UserAssessment) {
  const status = assessment.status?.toUpperCase();
  return (
    STATUS_STYLES[status] || {
      label: status ? toTitleCase(status) : "Unknown",
      className:
        "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-400/10 dark:text-slate-200 dark:border-slate-400/20",
    }
  );
}

function getActionConfig(assessment: UserAssessment): {
  label: string;
  icon: LucideIcon;
  className: string;
} {
  const status = assessment.status?.toUpperCase();

  if (status === "NOT_STARTED") {
    return {
      label: "Start",
      icon: PlayCircle,
      className:
        "bg-[#5b2ed4] text-white ring-[#5b2ed4] hover:bg-[#4820b8] focus-visible:ring-[#5b2ed4]",
    };
  }

  if (status === "FAILED") {
    if (assessment.attempts_remaining === 0) {
      return {
        label: "Review",
        icon: Eye,
        className:
          "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100 dark:bg-white/10 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/15 focus-visible:ring-slate-500",
      };
    }

    return {
      label: "Retake",
      icon: RotateCcw,
      className:
        "bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/25 dark:hover:bg-rose-400/15 focus-visible:ring-rose-500",
    };
  }

  if (status === "PASSED" || status === "GRADED") {
    return {
      label: "View Result",
      icon: Eye,
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/25 dark:hover:bg-emerald-400/15 focus-visible:ring-emerald-500",
    };
  }

  if (status === "SUBMITTED") {
    return {
      label: "Continue",
      icon: FilePenLine,
      className:
        "bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/25 dark:hover:bg-amber-400/15 focus-visible:ring-amber-500",
    };
  }

  return {
    label: "Open",
    icon: FilePenLine,
    className:
      "bg-white text-[#4f2ccf] ring-[#c7bdf4] hover:bg-[#f6f3ff] dark:bg-[#0f1726] dark:text-[#c9beff] dark:ring-[#51477d] dark:hover:bg-[#171d31] focus-visible:ring-[#5b2ed4]",
  };
}

function formatAttempts(assessment: UserAssessment) {
  const type = assessment.assessment_type?.toUpperCase();
  if (type !== "QUIZ" && type !== "QUIZ_GROUP") {
    return "Not applicable";
  }

  return `${formatAttemptsUsed(assessment)}; ${formatAttemptsRemaining(
    assessment,
  )}`;
}

function formatAttemptsUsed(assessment: UserAssessment) {
  const used =
    typeof assessment.attempts_used === "number"
      ? assessment.attempts_used
      : 0;

  if (typeof assessment.max_attempts === "number") {
    return `${used} of ${assessment.max_attempts} used`;
  }

  return `${used} used`;
}

function formatAttemptsRemaining(assessment: UserAssessment) {
  if (typeof assessment.attempts_remaining === "number") {
    return `${assessment.attempts_remaining} remaining`;
  }

  if (typeof assessment.max_attempts === "number") {
    return "0 remaining";
  }

  return "Unlimited attempts";
}

function getAssessmentMetaLabel(assessment: UserAssessment) {
  const type = assessment.assessment_type?.toUpperCase();
  const typeLabel =
    type === "ESSAY"
      ? "Written Assignment"
      : type === "QUIZ"
        ? "Quiz"
        : type === "QUIZ_GROUP"
          ? "Quiz Group"
          : "Assessment";
  const estimate = getEstimatedMinutes(assessment);

  return estimate > 0 ? `${typeLabel} - ${formatMinutes(estimate)}` : typeLabel;
}

function getRulesLabel(assessment: UserAssessment) {
  const type = assessment.assessment_type?.toUpperCase();

  if (type === "QUIZ" || type === "QUIZ_GROUP") {
    return typeof assessment.pass_mark_percentage === "number"
      ? `${Math.round(assessment.pass_mark_percentage)}% pass`
      : "No pass mark";
  }

  if (type === "ESSAY") {
    if (assessment.is_published) return "Grade published";
    if (assessment.is_graded) return "Graded";
    return "Instructor review";
  }

  return "-";
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

function getFeedbackPreview(assessment: UserAssessment) {
  const status = assessment.status?.toUpperCase();
  if (status === "FAILED") {
    return "Review your score and try again while attempts are still available.";
  }
  if (status === "PASSED" || status === "GRADED") {
    return "Your result is available. Open the assessment to review the details.";
  }
  return "Submitted and awaiting instructor review.";
}

function formatDueDate(value: string) {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(date);

  return `${datePart} ${timePart} WAT`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function getCalendarDays(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDay = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
}

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDayRangeParams(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function mergeByItemId(items: UserAssessment[]) {
  const map = new Map<string, UserAssessment>();
  items.forEach((item) => map.set(item.item_id, item));
  return Array.from(map.values());
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
