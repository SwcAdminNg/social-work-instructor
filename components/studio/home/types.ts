import type { AdminOverview } from "@/components/dashboard/instructor/types";
import type { ApprovalCounts, ApprovalRow, ManagedCourse } from "@/lib/studio/types";
import type { OpenRevisionInfo } from "@/components/studio/courses/courseStatus";

export type HomeData = {
  firstName?: string | null;
  courses: ManagedCourse[];
  courseTotal: number;
  /** course_id → open revision (from the inbox + lazily-read governance blocks). */
  revisions: Record<string, OpenRevisionInfo>;
  counts: ApprovalCounts | null;
  returned: ApprovalRow[];
  drafts: ApprovalRow[];
  awaiting: ApprovalRow[];
  adminOverview: AdminOverview | null;
};
