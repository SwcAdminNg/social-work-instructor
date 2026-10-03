"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Flag,
  Layers,
  ListChecks,
  PenLine,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Segmented,
  Select,
  StatCard,
  cn,
} from "@/components/ui/primitives";
import { useAccess } from "@/components/studio/AccessContext";
import { LifecycleBadge } from "@/components/studio/StatusBadges";
import { ASSESSMENT_TYPE_LABELS, formatDate, relativeTime } from "@/lib/studio/labels";
import type { AssessmentType, Item, ManagedCourse } from "@/lib/studio/types";
import { byOrder } from "./shared";

type Row = {
  key: string;
  courseId: string;
  courseTitle: string;
  lifecycle: string;
  sectionTitle: string;
  sectionNumber: number;
  item: Item;
  type: AssessmentType;
  final: boolean;
  moderated: boolean;
  passMark: number | null;
  questions: number | null;
  draw: number | null;
  due: string | null;
  issues: number;
};

const TYPE_META: Record<AssessmentType, { icon: typeof ListChecks; tile: string }> = {
  QUIZ: { icon: ListChecks, tile: "bg-sky-50 text-sky-600 ring-sky-200/70 dark:bg-sky-500/12 dark:text-sky-300 dark:ring-sky-400/20" },
  ESSAY: { icon: PenLine, tile: "bg-amber-50 text-amber-600 ring-amber-200/70 dark:bg-amber-500/12 dark:text-amber-300 dark:ring-amber-400/20" },
  QUIZ_GROUP: { icon: Layers, tile: "bg-violet-50 text-violet-600 ring-violet-200/70 dark:bg-violet-500/12 dark:text-violet-300 dark:ring-violet-400/20" },
};

function flatten(courses: ManagedCourse[]): Row[] {
  const rows: Row[] = [];
  for (const c of courses) {
    const lifecycle = c.governance?.lifecycle ?? c.governance_status ?? (c.is_published ? "PUBLISHED" : "DRAFT");
    byOrder(c.sections).forEach((s, si) => {
      for (const item of byOrder(s.items)) {
        const a = item.assessment;
        if (item.item_type !== "ASSESSMENT" || !a) continue;
        const type = a.assessment_type;
        let questions: number | null = null;
        let draw: number | null = null;
        let issues = 0;
        if (type === "QUIZ") {
          const qs = a.quiz?.questions ?? [];
          questions = qs.length;
          issues = qs.filter((q) => (q.options ?? []).length < 2 || !(q.options ?? []).some((o) => o.is_correct)).length + (qs.length ? 0 : 1);
        } else if (type === "QUIZ_GROUP") {
          const groups = a.quiz_group?.sections ?? [];
          questions = groups.reduce((n, g) => n + (g.questions?.length ?? 0), 0);
          draw = groups.reduce((n, g) => n + Math.min(g.questions_to_ask ?? g.questions?.length ?? 0, g.questions?.length ?? 0), 0);
          issues = groups.length ? groups.filter((g) => !(g.questions ?? []).length).length : 1;
        } else if (!a.essay?.question?.trim()) issues = 1;
        const settings = type === "ESSAY" ? a.essay : type === "QUIZ_GROUP" ? a.quiz_group : a.quiz;
        rows.push({
          key: `${c.id}:${item.id}`,
          courseId: c.id,
          courseTitle: c.title,
          lifecycle,
          sectionTitle: s.title,
          sectionNumber: si + 1,
          item,
          type,
          final: !!a.is_final_assessment,
          moderated: type === "ESSAY" && !!a.essay?.requires_moderation,
          passMark: settings?.pass_mark_percentage ?? null,
          questions,
          draw,
          due: a.due_date ?? null,
          issues,
        });
      }
    });
  }
  return rows;
}

type TypeFilter = "ALL" | AssessmentType;

export function AssessmentsHub({
  courses,
  failed,
  skipped,
}: {
  courses: ManagedCourse[];
  failed?: boolean;
  skipped?: number;
}) {
  const router = useRouter();
  const { capabilities } = useAccess();
  const [refreshing, startRefresh] = useTransition();
  const [type, setType] = useState<TypeFilter>("ALL");
  const [courseId, setCourseId] = useState("");
  const [query, setQuery] = useState("");
  const [finalOnly, setFinalOnly] = useState(false);

  const rows = useMemo(() => flatten(courses), [courses]);
  const stats = useMemo(
    () => ({
      total: rows.length,
      quizzes: rows.filter((r) => r.type === "QUIZ").length,
      essays: rows.filter((r) => r.type === "ESSAY").length,
      groups: rows.filter((r) => r.type === "QUIZ_GROUP").length,
      finals: rows.filter((r) => r.final).length,
    }),
    [rows],
  );
  const coursesWithAssessments = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => seen.set(r.courseId, r.courseTitle));
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) =>
      (type === "ALL" || r.type === type) &&
      (!courseId || r.courseId === courseId) &&
      (!finalOnly || r.final) &&
      (!q || `${r.item.title} ${r.courseTitle} ${r.sectionTitle}`.toLowerCase().includes(q)),
  );
  const filtering = type !== "ALL" || !!courseId || !!q || finalOnly;

  function refresh() {
    startRefresh(() => router.refresh());
  }

  function clearFilters() {
    setType("ALL");
    setCourseId("");
    setQuery("");
    setFinalOnly(false);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Assessments"
        title="Every quiz, essay and exam in one place"
        description="See how each assessment is set up across your courses, jump into the editor, and mark essay submissions."
        actions={
          <Button variant="outline" icon={RefreshCw} loading={refreshing} onClick={refresh}>
            Refresh
          </Button>
        }
      />

      {failed && (
        <Callout
          tone="danger"
          icon={AlertTriangle}
          title="We couldn't load your courses"
          actions={
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={refresh}>
              Try again
            </Button>
          }
        >
          Check your connection and try again.
        </Callout>
      )}

      {!failed && courses.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No courses yet"
          description="Assessments live inside a course's curriculum. Create a course, add a module, then add a quiz, essay or quiz group."
          action={
            capabilities.can_create_courses ? (
              <ButtonLink href="/dashboard/courses/new" icon={Plus}>
                Create a course
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        !failed && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
              <StatCard label="All assessments" value={stats.total} icon={ClipboardCheck} />
              <StatCard label="Quizzes" value={stats.quizzes} icon={ListChecks} tone="info" />
              <StatCard label="Essays" value={stats.essays} icon={PenLine} tone="warning" />
              <StatCard label="Quiz groups" value={stats.groups} icon={Layers} tone="violet" />
              <StatCard label="Module gates" value={stats.finals} icon={Flag} tone="success" hint="Final assessments" />
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No assessments yet"
                description="Open a course, go to Curriculum and add a quiz, essay or quiz group to any module. They'll all show up here."
                action={
                  courses[0] ? (
                    <ButtonLink href={`/dashboard/courses/${courses[0].id}?tab=curriculum`} icon={Plus}>
                      Add one to {courses[0].title.length > 28 ? "a course" : courses[0].title}
                    </ButtonLink>
                  ) : undefined
                }
              />
            ) : (
              <Card padded={false} className="overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center dark:border-ink-line">
                  <div className="-mx-1 overflow-x-auto px-1">
                    <Segmented<TypeFilter>
                      value={type}
                      onChange={setType}
                      options={[
                        { key: "ALL", label: `All ${stats.total}` },
                        { key: "QUIZ", label: "Quizzes" },
                        { key: "ESSAY", label: "Essays" },
                        { key: "QUIZ_GROUP", label: "Quiz groups" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
                    <button
                      type="button"
                      aria-pressed={finalOnly}
                      onClick={() => setFinalOnly((v) => !v)}
                      className={cn(
                        "inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition",
                        finalOnly
                          ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/12 dark:text-violet-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-ink-line dark:bg-ink-surface dark:text-slate-300",
                      )}
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Module gates
                    </button>
                    <Select aria-label="Filter by course" value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sm:w-56">
                      <option value="">All courses</option>
                      {coursesWithAssessments.map(([id, title]) => (
                        <option key={id} value={id}>
                          {title}
                        </option>
                      ))}
                    </Select>
                    <div className="sm:w-64">
                      <Input
                        aria-label="Search assessments"
                        placeholder="Search assessments…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        leading={<Search className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <EmptyState
                    compact
                    icon={Search}
                    title="Nothing matches those filters"
                    description="Try another course or type, or clear the search."
                    action={
                      filtering ? (
                        <Button size="sm" variant="outline" icon={X} onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : undefined
                    }
                    className="m-4"
                  />
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-ink-line">
                    {filtered.map((r) => (
                      <AssessmentRow key={r.key} row={r} canMark={!!capabilities.can_mark_essays} />
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {!!skipped && skipped > 0 && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Showing assessments from your first {courses.length} courses. Open a course directly to see the rest.
              </p>
            )}
          </>
        )
      )}
    </div>
  );
}

function AssessmentRow({ row: r, canMark }: { row: Row; canMark: boolean }) {
  const meta = TYPE_META[r.type];
  const Icon = meta.icon;
  const live = r.lifecycle === "PUBLISHED";
  const editHref = `/dashboard/courses/${r.courseId}?tab=curriculum&item=${r.item.id}`;
  return (
    <li className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50/60 sm:px-5 lg:flex-row lg:items-center lg:gap-6 dark:hover:bg-white/[0.02]">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset", meta.tile)}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold text-slate-900 dark:text-white">{r.item.title}</p>
            <Badge size="xs" tone={r.type === "QUIZ" ? "info" : r.type === "ESSAY" ? "warning" : "violet"}>
              {ASSESSMENT_TYPE_LABELS[r.type]}
            </Badge>
            {r.final && (
              <Badge size="xs" tone="violet" icon={Flag} title="Learners must pass this to unlock the next module">
                Module gate
              </Badge>
            )}
            {r.moderated && (
              <Badge size="xs" tone="info" icon={ShieldCheck} title="Marks are moderated before release">
                Moderated
              </Badge>
            )}
            {r.issues > 0 && (
              <Badge size="xs" tone="warning" icon={AlertTriangle}>
                Needs attention
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{r.courseTitle}</span>
            <span aria-hidden>›</span>
            <span className="truncate">
              Module {r.sectionNumber}: {r.sectionTitle}
            </span>
            <LifecycleBadge lifecycle={r.lifecycle} size="xs" />
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-4 pl-[52px] text-xs lg:w-[22rem] lg:flex-shrink-0 lg:pl-0">
        <div>
          <dt className="text-slate-400">Pass mark</dt>
          <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">{r.passMark !== null ? `${r.passMark}%` : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">{r.type === "ESSAY" ? "Format" : "Questions"}</dt>
          <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
            {r.type === "ESSAY"
              ? r.item.assessment?.essay?.submission_mode === "DOCUMENT"
                ? "Upload"
                : "Typed"
              : r.type === "QUIZ_GROUP"
                ? `${r.draw ?? 0} of ${r.questions ?? 0}`
                : r.questions ?? 0}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Due</dt>
          <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100" title={r.due ? relativeTime(r.due) : undefined}>
            {r.due ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3 text-slate-400" />
                {formatDate(r.due, { day: "numeric", month: "short" })}
              </span>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      <div className="flex flex-shrink-0 gap-2 pl-[52px] lg:w-[15.5rem] lg:justify-end lg:pl-0">
        {r.type === "ESSAY" && canMark && live && (
          <ButtonLink href={`/dashboard/assessments/${r.item.id}?course=${r.courseId}`} size="sm" variant="secondary" icon={ClipboardCheck}>
            Mark submissions
          </ButtonLink>
        )}
        <ButtonLink href={editHref} size="sm" variant="outline" icon={PenLine}>
          Edit
        </ButtonLink>
      </div>
    </li>
  );
}
