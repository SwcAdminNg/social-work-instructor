import type { Item, ManagedCourse, QuizQuestion } from "./types";

export type HealthIssue = {
  /** "error" blocks a sensible submit; "warning" is worth a look. */
  severity: "error" | "warning";
  message: string;
  sectionId?: string;
  itemId?: string;
};

function questionIssues(questions: QuizQuestion[] | undefined, where: string, sectionId: string, itemId: string): HealthIssue[] {
  const out: HealthIssue[] = [];
  (questions ?? []).forEach((q, i) => {
    const options = q.options ?? [];
    if (options.length < 2) {
      out.push({ severity: "error", message: `${where}: question ${i + 1} needs at least two options`, sectionId, itemId });
    }
    if (!options.some((o) => o.is_correct)) {
      out.push({ severity: "error", message: `${where}: question ${i + 1} has no correct answer`, sectionId, itemId });
    }
  });
  return out;
}

function itemIssues(item: Item, sectionTitle: string, sectionId: string): HealthIssue[] {
  const where = `${sectionTitle} › ${item.title}`;
  const base = { sectionId, itemId: item.id };
  switch (item.item_type) {
    case "VIDEO": {
      const status = item.video?.status;
      if (status === "FAILED") return [{ ...base, severity: "error", message: `${where}: video processing failed — re-upload it` }];
      if (!item.video?.bunny_video_guid && status !== "READY" && status !== "PROCESSING")
        return [{ ...base, severity: "error", message: `${where}: no video uploaded yet` }];
      if (status === "PROCESSING" || status === "PENDING")
        return [{ ...base, severity: "warning", message: `${where}: video is still processing` }];
      return [];
    }
    case "DOCUMENT":
      return item.document?.is_uploaded ? [] : [{ ...base, severity: "error", message: `${where}: document upload is incomplete` }];
    case "ASSESSMENT": {
      const a = item.assessment;
      if (!a) return [];
      if (a.assessment_type === "QUIZ") {
        const qs = a.quiz?.questions ?? [];
        if (!qs.length) return [{ ...base, severity: "error", message: `${where}: quiz has no questions` }];
        return questionIssues(qs, where, sectionId, item.id);
      }
      if (a.assessment_type === "QUIZ_GROUP") {
        const groups = a.quiz_group?.sections ?? [];
        if (!groups.length) return [{ ...base, severity: "error", message: `${where}: quiz group has no sections` }];
        return groups.flatMap((g) => {
          const qs = g.questions ?? [];
          const out: HealthIssue[] = [];
          if (!qs.length) out.push({ ...base, severity: "error", message: `${where} › ${g.title}: no questions in the pool` });
          if (g.questions_to_ask && g.questions_to_ask > qs.length)
            out.push({ ...base, severity: "warning", message: `${where} › ${g.title}: asks ${g.questions_to_ask} but the pool has ${qs.length}` });
          return out.concat(questionIssues(qs, `${where} › ${g.title}`, sectionId, item.id));
        });
      }
      if (a.assessment_type === "ESSAY" && !a.essay?.question?.trim())
        return [{ ...base, severity: "error", message: `${where}: essay has no question` }];
      return [];
    }
    case "LIVE_SESSION": {
      const start = item.live_session?.scheduled_start_at;
      if (start && new Date(start).getTime() < Date.now() && item.live_session?.status === "SCHEDULED")
        return [{ ...base, severity: "warning", message: `${where}: scheduled time has passed` }];
      return [];
    }
    default:
      return [];
  }
}

/** Everything a reviewer would bounce. Shown in the editor and before submitting. */
export function curriculumHealth(course?: ManagedCourse | null): HealthIssue[] {
  if (!course) return [];
  const sections = course.sections ?? [];
  const issues: HealthIssue[] = [];
  if (!sections.some((s) => (s.items ?? []).length)) {
    issues.push({ severity: "error", message: "Add at least one lesson or assessment before submitting" });
  }
  if (!course.description?.trim()) issues.push({ severity: "warning", message: "The course has no description" });
  if (!course.what_you_will_learn?.length) issues.push({ severity: "warning", message: "Add learning outcomes so learners know what they'll gain" });
  if (!course.thumbnail_url) issues.push({ severity: "warning", message: "The course has no cover image" });
  for (const s of sections) {
    if (!(s.items ?? []).length) issues.push({ severity: "warning", message: `${s.title}: module is empty`, sectionId: s.id });
    for (const item of s.items ?? []) issues.push(...itemIssues(item, s.title, s.id));
  }
  return issues;
}

export function itemHealth(item: Item, sectionTitle = "", sectionId = "") {
  return itemIssues(item, sectionTitle, sectionId);
}
