// Small, pure helpers shared by My courses and the dashboard home.
import type { Tone } from "@/lib/studio/labels";
import { isInReview } from "@/lib/studio/labels";
import type { ApprovalRow, Course, Lifecycle } from "@/lib/studio/types";

/**
 * The course lifecycle. With governance off `governance_status` may not track
 * the legacy publish toggle, so fall back to `is_published`.
 */
export function courseLifecycle(course: Pick<Course, "governance_status" | "is_published">, governanceEnabled: boolean): Lifecycle {
  if (course.governance_status === "ARCHIVED") return "ARCHIVED";
  if (!governanceEnabled) return course.is_published ? "PUBLISHED" : "DRAFT";
  return course.governance_status ?? (course.is_published ? "PUBLISHED" : "DRAFT");
}

export type OpenRevisionInfo = { id?: string; status?: string; kind?: string };

/** course_id → open revision, built from Approval Centre rows (my_drafts, returned_to_me…). */
export function revisionMapFromRows(...lists: (ApprovalRow[] | undefined)[]) {
  const map: Record<string, OpenRevisionInfo> = {};
  for (const rows of lists) {
    for (const row of rows ?? []) {
      if (row.kind !== "COURSE_REVISION" || !row.course_id) continue;
      // A later list (e.g. returned_to_me) wins over an earlier one.
      map[row.course_id] = { id: row.id, status: row.status };
    }
  }
  return map;
}

export type RevisionPill = { label: string; tone: Tone; attention?: boolean };

/**
 * Card badge for the open revision. A DRAFT revision on a never-published
 * course is just "the draft", so it gets no extra badge.
 */
export function revisionPill(status: string | undefined | null, lifecycle: Lifecycle): RevisionPill | null {
  if (!status) return null;
  if (status === "RETURNED_FOR_REVISION") return { label: "Changes requested", tone: "warning", attention: true };
  if (status === "READY_TO_PUBLISH") return { label: "Approved", tone: "success" };
  if (isInReview(status)) return { label: "In review", tone: "info" };
  if (status === "DRAFT") return lifecycle === "DRAFT" ? null : { label: "Draft changes", tone: "violet", attention: true };
  return null;
}

/** Deterministic gradient for courses without a cover image. */
const GRADIENTS = [
  ["#2d6a4f", "#52b788"],
  ["#1d4ed8", "#38bdf8"],
  ["#7c3aed", "#c084fc"],
  ["#b45309", "#fbbf24"],
  ["#be123c", "#fb7185"],
  ["#0f766e", "#2dd4bf"],
  ["#4338ca", "#818cf8"],
  ["#15803d", "#a3e635"],
];

export function coverGradient(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const [a, b] = GRADIENTS[h % GRADIENTS.length];
  const angle = 115 + (h % 50);
  return `linear-gradient(${angle}deg, ${a} 0%, ${b} 100%)`;
}
