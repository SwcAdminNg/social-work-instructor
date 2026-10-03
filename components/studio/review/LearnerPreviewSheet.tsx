"use client";

// STUB — owned by the Review workstream. Shows the course as a learner sees it.
// With a revisionId it renders GET /governance/revisions/{id}/preview; without one
// (governance off) it renders the given course's sections, hiding answers.
import type { ManagedCourse } from "@/lib/studio/types";

export function LearnerPreviewSheet(_props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisionId?: string | null;
  course?: ManagedCourse | null;
}) {
  return null;
}
