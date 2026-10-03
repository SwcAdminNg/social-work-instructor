import type {
  AssessmentType,
  CourseCategory,
  CourseLevel,
  Decision,
  DiffOp,
  ItemType,
  Lifecycle,
  RevisionKind,
  RevisionStatus,
  Risk,
  RiskFlag,
  Stage,
  StageStatus,
} from "./types";

/** Semantic colour for badges, pills and banners. */
export type Tone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "violet";

export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  DEVELOPMENT: "Development",
  BUSINESS: "Business",
  FINANCE_ACCOUNTING: "Finance & Accounting",
  IT_SOFTWARE: "IT & Software",
  OFFICE_PRODUCTIVITY: "Office Productivity",
  PERSONAL_DEVELOPMENT: "Personal Development",
  DESIGN: "Design",
  MARKETING: "Marketing",
  HEALTH_FITNESS: "Health & Fitness",
  MUSIC: "Music",
  TEACHING_ACADEMICS: "Teaching & Academics",
  PHOTOGRAPHY_VIDEO: "Photography & Video",
  LIFESTYLE: "Lifestyle",
  LANGUAGE: "Language",
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  VIDEO: "Video",
  DOCUMENT: "Document",
  LINKS: "Link",
  LIVE_SESSION: "Live session",
  ASSESSMENT: "Assessment",
};

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  QUIZ: "Quiz",
  ESSAY: "Essay",
  QUIZ_GROUP: "Quiz group",
};

export const LIFECYCLE: Record<Lifecycle, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  PUBLISHED: { label: "Live", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "warning" },
};

export const REVISION_KIND_LABELS: Record<RevisionKind, string> = {
  INITIAL: "First release",
  CHANGE: "Update",
  ROLLBACK: "Rollback",
  REINSTATE: "Reinstatement",
};

export const REVISION_STATUS: Record<RevisionStatus, { label: string; tone: Tone; short?: string }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SUBMITTED_FOR_REVIEW: { label: "Submitted for review", tone: "info", short: "In review" },
  ACADEMIC_REVIEW: { label: "In academic review", tone: "info", short: "In review" },
  ACADEMICALLY_APPROVED: { label: "Academically approved", tone: "info", short: "In review" },
  ASSESSMENT_MODERATION: { label: "In assessment moderation", tone: "info", short: "In review" },
  QA_REVIEW: { label: "In QA review", tone: "info", short: "In review" },
  QA_APPROVED: { label: "QA approved", tone: "info", short: "In review" },
  COURSE_APPROVED: { label: "Course lead approved", tone: "info", short: "In review" },
  FINAL_APPROVAL_REQUIRED: { label: "Awaiting final approval", tone: "violet", short: "In review" },
  READY_TO_PUBLISH: { label: "Approved — ready to publish", tone: "success", short: "Approved" },
  RETURNED_FOR_REVISION: { label: "Changes requested", tone: "warning" },
  PUBLISHED: { label: "Published", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  WITHDRAWN: { label: "Withdrawn", tone: "neutral" },
};

/** Statuses where the revision is travelling through review (read-only for the author). */
export const IN_REVIEW_STATUSES: RevisionStatus[] = [
  "SUBMITTED_FOR_REVIEW",
  "ACADEMIC_REVIEW",
  "ACADEMICALLY_APPROVED",
  "ASSESSMENT_MODERATION",
  "QA_REVIEW",
  "QA_APPROVED",
  "COURSE_APPROVED",
  "FINAL_APPROVAL_REQUIRED",
  "READY_TO_PUBLISH",
];

export function isInReview(status?: string | null) {
  return !!status && IN_REVIEW_STATUSES.includes(status as RevisionStatus);
}

export const STAGE: Record<Stage, { label: string; role: string; description: string }> = {
  QUICK_APPROVAL: {
    label: "Quick approval",
    role: "QA Reviewer or Course Lead",
    description: "A single sign-off for low-risk fixes.",
  },
  ACADEMIC_REVIEW: {
    label: "Academic review",
    role: "Academic Reviewer",
    description: "Accuracy, outcomes and appropriateness of content.",
  },
  ASSESSMENT_MODERATION: {
    label: "Assessment moderation",
    role: "Assessment Moderator",
    description: "Questions, answers, pass marks and attempts.",
  },
  QA_REVIEW: {
    label: "Quality review",
    role: "QA Reviewer",
    description: "Structure, consistency, links and uploads.",
  },
  COURSE_LEAD_APPROVAL: {
    label: "Course lead approval",
    role: "Course Lead",
    description: "Course-level sign-off.",
  },
  FINAL_APPROVAL: {
    label: "Final approval",
    role: "Head of Learning",
    description: "Required for high-risk changes and every new course.",
  },
};

export const STAGE_STATUS: Record<StageStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Waiting", tone: "neutral" },
  IN_REVIEW: { label: "In review", tone: "info" },
  APPROVED: { label: "Approved", tone: "success" },
  APPROVED_WITH_CONDITIONS: { label: "Approved with minor changes", tone: "success" },
  RETURNED: { label: "Returned", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "danger" },
  SKIPPED: { label: "Skipped", tone: "neutral" },
  SUPERSEDED: { label: "Superseded", tone: "neutral" },
};

export const DECISION: Record<Decision, { label: string; verb: string; tone: Tone }> = {
  APPROVED: { label: "Approved", verb: "Approve", tone: "success" },
  APPROVED_WITH_MINOR_CHANGES: { label: "Approved with minor changes", verb: "Approve with minor changes", tone: "success" },
  RETURNED_FOR_REVISION: { label: "Returned for revision", verb: "Return for revision", tone: "warning" },
  REJECTED: { label: "Rejected", verb: "Reject", tone: "danger" },
  ESCALATED: { label: "Escalated", verb: "Escalate", tone: "violet" },
  FORCE_APPROVED: { label: "Force approved", verb: "Force approve", tone: "violet" },
};

export const RISK: Record<Risk, { label: string; tone: Tone; description: string }> = {
  LOW: { label: "Low risk", tone: "success", description: "Quick approval by one reviewer." },
  MEDIUM: { label: "Medium risk", tone: "warning", description: "Academic, QA and course lead review." },
  HIGH: { label: "High risk", tone: "danger", description: "Full review including the Head of Learning." },
};

export const RISK_FLAGS: Record<RiskFlag, { label: string; description: string }> = {
  SAFEGUARDING: { label: "Safeguarding", description: "Touches child or adult protection practice." },
  LEGAL: { label: "Legal", description: "Statutory or legal content." },
  POLICY: { label: "Policy", description: "Organisational or national policy." },
  CERTIFICATE_RULE: { label: "Certificate rule", description: "Changes how certificates are earned." },
  CPD_RECOGNITION: { label: "CPD recognition", description: "Affects CPD hours or accreditation." },
};

export const DIFF_OP: Record<DiffOp, { label: string; tone: Tone }> = {
  ADDED: { label: "Added", tone: "success" },
  REMOVED: { label: "Removed", tone: "danger" },
  MODIFIED: { label: "Edited", tone: "info" },
  MOVED: { label: "Moved", tone: "violet" },
};

export const APPROVAL_ITEM_TYPES: Record<string, string> = {
  Course: "New course",
  Lesson: "Lesson",
  Assessment: "Assessment",
  "Course update": "Course update",
  Rollback: "Rollback",
  Reinstatement: "Reinstatement",
  "Essay mark": "Essay mark",
  "Essay mark (disputed)": "Disputed essay mark",
};

/** Fallback for any enum we don't have a label for: "FOO_BAR" → "Foo bar". */
export function humanize(value?: string | null) {
  if (!value) return "";
  const s = value.replaceAll("_", " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function revisionStatus(status?: string | null) {
  return REVISION_STATUS[status as RevisionStatus] ?? { label: humanize(status), tone: "neutral" as Tone };
}

export function stageLabel(stage?: string | null) {
  return STAGE[stage as Stage]?.label ?? humanize(stage);
}

/* ───────────────────────── Formatting ───────────────────────── */

const LOCALE = "en-NG";

export function formatDate(value?: string | null, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat(LOCALE, opts).format(d);
}

export function formatDateTime(value?: string | null) {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

/** "in 3 days", "2 hours ago", "just now". */
export function relativeTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return "";
  const diff = d - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function formatMoney(value?: number | null) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(
    Number(value ?? 0),
  );
}

export function formatMinutes(total?: number | null) {
  const m = Math.round(Number(total ?? 0));
  if (!m) return "";
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h}h ${r}m` : `${h}h`;
}

export function formatBytes(bytes?: number | null) {
  const b = Number(bytes ?? 0);
  if (!b) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  return `${(b / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function initials(name?: string | null) {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Convert an ISO string to the value a <input type="datetime-local"> expects (local time). */
export function toLocalInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a datetime-local value back to an ISO string (UTC). */
export function fromLocalInput(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
