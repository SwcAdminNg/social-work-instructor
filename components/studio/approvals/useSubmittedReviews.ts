"use client";

// "Submitted by me": revisions the signed-in user has sent for review and that
// are still travelling through it. The Approval Centre API has no view for this
// (its views are drafts, returned, recent decisions and reviewer queues), so it's
// assembled from the courses the user manages:
//   GET /courses/manage → GET /courses/{id}/governance → GET /governance/revisions/{id}

import { useQuery } from "@tanstack/react-query";
import { studioApi } from "@/lib/studio/api";
import { isInReview } from "@/lib/studio/labels";
import type { ApprovalRow, ManagedCourse, Revision, RevisionKind } from "@/lib/studio/types";

export type SubmittedRow = ApprovalRow & {
  submitted_at?: string;
  /** Approved stages / all stages in the current round. */
  progress?: { done: number; total: number };
};

const ITEM_TYPE: Record<RevisionKind, string> = {
  INITIAL: "Course",
  CHANGE: "Course update",
  ROLLBACK: "Rollback",
  REINSTATE: "Reinstatement",
};

const CONCURRENCY = 6;
const MAX_PAGES = 5; // 500 courses is far beyond any instructor; keeps admins bounded too

/** Run `fn` over `items` with at most CONCURRENCY in flight; failures become null. */
async function pool<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<(R | null)[]> {
  const out: (R | null)[] = new Array(items.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        out[i] = await fn(items[i]);
      } catch {
        out[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return out;
}

async function allManagedCourses(): Promise<ManagedCourse[]> {
  const courses: ManagedCourse[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await studioApi.listCourses({ page, page_size: 100 });
    courses.push(...res.items);
    if (!res.meta?.has_next) break;
  }
  return courses;
}

function toRow(revision: Revision, course: ManagedCourse): SubmittedRow {
  const round = revision.round ?? 0;
  const stages = (revision.stages ?? []).filter((s) => (s.round ?? round) === round && s.status !== "SUPERSEDED");
  const counted = stages.filter((s) => s.status !== "SKIPPED");
  const done = counted.filter((s) => s.status === "APPROVED" || s.status === "APPROVED_WITH_CONDITIONS").length;
  const current = stages.find((s) => s.stage === revision.current_stage && (s.status === "PENDING" || s.status === "IN_REVIEW"));

  return {
    kind: "COURSE_REVISION",
    id: revision.id,
    item_title: revision.course_title || course.title,
    item_type: ITEM_TYPE[revision.kind] ?? "Course update",
    course_id: revision.course_id ?? course.id,
    course_title: revision.course_title || course.title,
    submitted_by: revision.author,
    current_stage: revision.current_stage,
    status: revision.status,
    reviewer: current?.assigned_reviewer,
    due_at: current?.due_at,
    is_overdue: !!current?.is_overdue,
    risk: revision.effective_risk ?? revision.computed_risk,
    version_label: revision.proposed_version_label,
    available_actions: revision.available_actions,
    submitted_at: revision.submitted_at,
    progress: counted.length ? { done, total: counted.length } : undefined,
  };
}

export async function loadSubmitted(userId?: string | null): Promise<SubmittedRow[]> {
  const courses = await allManagedCourses();
  const governance = await pool(courses, (c) => studioApi.getGovernance(c.id));
  const inReview = courses
    .map((course, i) => ({ course, open: governance[i]?.open_revision }))
    .filter((x): x is { course: ManagedCourse; open: NonNullable<typeof x.open> } => !!x.open && isInReview(x.open.status));

  const details = await pool(inReview, (x) => studioApi.getRevision(x.open.id));
  const rows: SubmittedRow[] = [];
  details.forEach((revision, i) => {
    if (!revision || !isInReview(revision.status)) return;
    // Only work this user authored or edited — admins can manage every course.
    const mine =
      !userId || revision.author?.id === userId || (revision.contributors ?? []).some((p) => p.id === userId);
    if (mine) rows.push(toRow(revision, inReview[i].course));
  });

  // Overdue first, then the most recently submitted.
  return rows.sort((a, b) => {
    if (!!a.is_overdue !== !!b.is_overdue) return a.is_overdue ? -1 : 1;
    return (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "");
  });
}

export function useSubmittedReviews(userId: string | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["studio", "approval", "submitted", userId ?? "me"],
    queryFn: () => loadSubmitted(userId),
    enabled,
    staleTime: 30_000,
  });
}
