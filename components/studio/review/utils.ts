// Helpers shared by the review / approval screens.
import { ApiError } from "@/lib/studio/api";
import { humanize } from "@/lib/studio/labels";
import type {
  AnchorType,
  DiffChange,
  Item,
  PersonRef,
  RevisionDiff,
  RevisionStage,
  Risk,
  Section,
  Stage,
} from "@/lib/studio/types";

export const RISK_ORDER: Risk[] = ["LOW", "MEDIUM", "HIGH"];

export function maxRisk(...levels: (Risk | null | undefined)[]): Risk | undefined {
  let best = -1;
  for (const l of levels) {
    const i = l ? RISK_ORDER.indexOf(l) : -1;
    if (i > best) best = i;
  }
  return best >= 0 ? RISK_ORDER[best] : undefined;
}

export function higherRisks(than?: Risk | null): Risk[] {
  const i = than ? RISK_ORDER.indexOf(than) : -1;
  return RISK_ORDER.slice(i + 1);
}

/** The stages a revision of this risk would travel through (§3.4). */
export function routeForRisk(risk: Risk | undefined, touchesAssessment?: boolean): Stage[] {
  if (!risk) return [];
  if (risk === "LOW") return ["QUICK_APPROVAL"];
  const path: Stage[] = ["ACADEMIC_REVIEW"];
  if (touchesAssessment) path.push("ASSESSMENT_MODERATION");
  path.push("QA_REVIEW", "COURSE_LEAD_APPROVAL");
  if (risk === "HIGH") path.push("FINAL_APPROVAL");
  return path;
}

/** Stages of the current round, in order, without superseded ones. */
export function currentRoundStages(stages?: RevisionStage[], round?: number) {
  return (stages ?? [])
    .filter((s) => (round === undefined || s.round === undefined || s.round === round) && s.status !== "SUPERSEDED")
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
}

export function personName(p?: PersonRef | null, fallback = "Someone") {
  return p?.name?.trim() || fallback;
}

export function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

/* ───────────────────────── Values ───────────────────────── */

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  order_index: "Position",
  is_preview: "Free preview",
  estimated_minutes: "Duration (min)",
  is_correct: "Correct answer",
  text: "Text",
  pass_mark_percentage: "Pass mark (%)",
  max_attempts: "Attempts allowed",
  time_limit_seconds: "Time limit (sec)",
  show_result_to_student: "Show result to learner",
  is_final_assessment: "Final assessment",
  allow_multiple_answers: "Multiple answers",
  multi_answer_mode: "Multi-answer mode",
  questions_to_ask: "Questions asked",
  what_you_will_learn: "Learning outcomes",
  material_includes: "Course includes",
  requirements: "Requirements",
  prerequisite: "Prerequisite",
  certificate_enabled: "Certificate",
  certificate_pass_mark_percentage: "Certificate pass mark (%)",
  certificate_template_id: "Certificate design",
  section_id: "Module",
  file_name: "File",
  url: "URL",
  label: "Link label",
  question: "Question",
  submission_mode: "Submission",
  requires_moderation: "Needs moderation",
  due_date: "Due date",
  assessment_type: "Assessment type",
  item_type: "Lesson type",
  downloadable: "Downloadable",
  bunny_video_guid: "Video",
  storage_key: "Stored file",
};

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? humanize(field);
}

const ENTITY_LABELS: Record<string, string> = {
  course: "Course details",
  section: "Module",
  item: "Lesson",
  video: "Video",
  document: "Document",
  link: "Link",
  assessment: "Assessment",
  assessment_settings: "Assessment settings",
  group_section: "Question pool",
  question: "Question",
  option: "Answer option",
};

export function entityLabel(entity: string) {
  return ENTITY_LABELS[entity] ?? humanize(entity);
}

/** Render any JSON value as a short readable string. */
export function formatValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return field === "order_index" ? `#${value + 1}` : String(value);
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    }
    return /^[A-Z][A-Z_]+$/.test(value) ? humanize(value) : value;
  }
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value.map((v) => (typeof v === "object" && v ? formatValue((v as { name?: unknown; text?: unknown }).name ?? (v as { text?: unknown }).text ?? JSON.stringify(v)) : formatValue(v))).join("\n");
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/* ───────────────────────── Anchors ───────────────────────── */

export type AnchorOption = { type: AnchorType; id: string; label: string; group: string };

const ANCHOR_ENTITY: Record<string, AnchorType> = { course: "course", section: "section", item: "item", question: "question" };

/**
 * Everything a comment can be pinned to: the course, each module, lesson and
 * question in the tree, plus any changed entity in the diff (keyed by live id).
 */
export function buildAnchorOptions({
  courseId,
  courseTitle,
  sections,
  diff,
}: {
  courseId?: string;
  courseTitle?: string;
  sections?: Section[] | null;
  diff?: RevisionDiff | null;
}): AnchorOption[] {
  const out: AnchorOption[] = [];
  const seen = new Set<string>();
  const push = (o: AnchorOption) => {
    if (!o.id || seen.has(o.id)) return;
    seen.add(o.id);
    out.push(o);
  };
  if (courseId) push({ type: "course", id: courseId, label: courseTitle || "Whole course", group: "Course" });
  (sections ?? []).forEach((s, si) => {
    push({ type: "section", id: s.id, label: `Module ${si + 1}: ${s.title}`, group: "Modules" });
    for (const item of s.items ?? []) {
      push({ type: "item", id: item.id, label: `${s.title} › ${item.title}`, group: "Lessons" });
      for (const { question, where } of itemQuestions(item)) {
        push({
          type: "question",
          id: question.id,
          label: `${item.title}${where ? ` › ${where}` : ""} › ${truncate(question.text, 60)}`,
          group: "Questions",
        });
      }
    }
  });
  for (const c of diff?.changes ?? []) {
    const type = ANCHOR_ENTITY[c.entity];
    if (!type || !c.key) continue;
    push({ type, id: c.key, label: c.label, group: "Changed" });
  }
  return out;
}

function itemQuestions(item: Item) {
  const a = item.assessment;
  const out: { question: { id: string; text: string }; where?: string }[] = [];
  for (const q of a?.quiz?.questions ?? []) out.push({ question: q });
  for (const g of a?.quiz_group?.sections ?? []) for (const q of g.questions ?? []) out.push({ question: q, where: g.title });
  return out;
}

export function anchorLabel(anchors: AnchorOption[], type?: string | null, id?: string | null) {
  if (!type) return null;
  const found = id ? anchors.find((a) => a.id === id) : undefined;
  if (found) return found.label;
  if (type === "course") return "Whole course";
  return `A ${type === "section" ? "module" : type === "item" ? "lesson" : type} that has since changed`;
}

export function truncate(text: string | undefined | null, max: number) {
  const t = (text ?? "").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Normalise GET …/preview and …/tree (arrays of sections, or `{ sections }`). */
export function asSections(data: unknown): Section[] {
  if (Array.isArray(data)) return data as Section[];
  if (data && typeof data === "object" && Array.isArray((data as { sections?: unknown }).sections)) {
    return (data as { sections: Section[] }).sections;
  }
  return [];
}

export function diffCounts(changes?: DiffChange[]) {
  const counts = { ADDED: 0, MODIFIED: 0, REMOVED: 0, MOVED: 0 } as Record<string, number>;
  for (const c of changes ?? []) counts[c.op] = (counts[c.op] ?? 0) + 1;
  return counts;
}
