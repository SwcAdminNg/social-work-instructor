// Rules and helpers for AI question drafting (AI_ASSESSMENT_AUTHORING_API.md).

import { ABORTED, ApiError, TIMED_OUT } from "@/lib/studio/api";
import type { AiProvider, GeneratedQuestion, MultiAnswerMode, QuestionPayload } from "@/lib/studio/types";

export const PROVIDERS: { value: AiProvider; label: string; defaultModel: string }[] = [
  { value: "GEMINI", label: "Google Gemini", defaultModel: "gemini-3.7-flash" },
  { value: "OPENAI", label: "OpenAI", defaultModel: "gpt-4o-mini" },
  { value: "DEEPSEEK", label: "DeepSeek", defaultModel: "deepseek-v4-flash" },
];

export function providerLabel(value?: string | null) {
  return PROVIDERS.find((p) => p.value === value)?.label ?? value ?? "";
}

export const LIMITS = {
  promptMax: 5000,
  countMin: 1,
  countMax: 50,
  optionsMin: 2,
  optionsMax: 6,
  fileMaxBytes: 10 * 1024 * 1024,
  fileMaxChars: 40_000,
};

/** One-tap additions to the topic prompt (the doc's "prompt tips", §7.4). */
export const PROMPT_TIPS = [
  { label: "Scenario-based", text: "Use realistic practice scenarios rather than definitions." },
  { label: "Beginner level", text: "Pitch it at beginners and newly qualified practitioners." },
  { label: "Advanced level", text: "Pitch it at experienced practitioners; test judgement, not recall." },
  { label: "One multi-answer", text: "Include one question with more than one correct answer." },
  { label: "Law & policy", text: "Focus on applying the relevant law and policy." },
  { label: "No trivia", text: "Avoid trivia, dates and trick questions." },
];

/** Client-side check before uploading a document (§5.2, §9). */
export function validateDocument(file: File): string | null {
  if (!/\.(pdf|docx)$/i.test(file.name)) return "Only PDF and Word (.docx) documents are supported.";
  if (file.size === 0) return "This file is empty. Choose another one.";
  if (file.size > LIMITS.fileMaxBytes) return "This file is larger than 10 MB. Upload the relevant chapter instead.";
  return null;
}

/* ───────────────────────── Errors (§9) ───────────────────────── */

export type AiFailure = {
  kind: "locked" | "permission" | "provider-missing" | "provider-failed" | "file" | "validation" | "timeout" | "aborted" | "other";
  title: string;
  message: string;
  /** Safe to try again as-is (nothing was saved). */
  retryable: boolean;
  /** Suggest switching to another provider. */
  switchProvider: boolean;
};

export function classifyAiError(err: unknown, ctx: { mode: "topic" | "document"; persist: boolean; provider: AiProvider }): AiFailure {
  const e = err instanceof ApiError ? err : new ApiError((err as Error)?.message ?? "Something went wrong", 0);
  const name = providerLabel(ctx.provider);
  const maybeSaved = ctx.persist
    ? " Some questions may already have been added. We've refreshed the quiz, so check it before trying again."
    : "";

  if (e.code === ABORTED) {
    return { kind: "aborted", title: "Generation cancelled", message: `Nothing new was drafted.${maybeSaved}`, retryable: true, switchProvider: false };
  }
  if (e.code === TIMED_OUT) {
    return {
      kind: "timeout",
      title: `${name} took too long`,
      message: `The AI didn't answer within two minutes.${maybeSaved || " Nothing was saved."} Try again, ask for fewer questions, or use another provider.`,
      retryable: true,
      switchProvider: true,
    };
  }
  if (e.status === 409) {
    return { kind: "locked", title: "This course can't be edited right now", message: e.message, retryable: false, switchProvider: false };
  }
  if (e.status === 403) {
    return { kind: "permission", title: "You can't edit this course", message: e.message, retryable: false, switchProvider: false };
  }
  if (e.status === 413 || (e.status === 400 && ctx.mode === "document")) {
    const scanned = /scanned|ocr|no readable text/i.test(e.message);
    return {
      kind: "file",
      title: scanned ? "We couldn't find any text in this document" : "There's a problem with this document",
      message: scanned
        ? "It looks like a scanned or image-only PDF. Upload a text-based PDF or a Word document instead."
        : e.message,
      retryable: false,
      switchProvider: false,
    };
  }
  if (e.status === 422) {
    return { kind: "validation", title: "Check your settings", message: e.message, retryable: false, switchProvider: false };
  }
  if (e.status === 500 && /not configured/i.test(e.message)) {
    return {
      kind: "provider-missing",
      title: `${name} isn't set up yet`,
      message: "This provider hasn't been configured on the server. Try another one, or ask an administrator to set it up.",
      retryable: false,
      switchProvider: true,
    };
  }
  if (e.status === 502) {
    const shape = /fewer than|no correct answer|invalid json|unexpected shape|did not generate/i.test(e.message);
    return {
      kind: "provider-failed",
      title: shape ? "The AI's answer didn't pass our checks" : `${name} couldn't generate questions`,
      message: `${shape ? "The draft had missing options or answers, so we threw it away." : e.message} Nothing was saved, so it's safe to try again. A more specific prompt or a different provider often helps.`,
      retryable: true,
      switchProvider: true,
    };
  }
  return { kind: "other", title: "Something went wrong", message: e.message, retryable: true, switchProvider: false };
}

/* ───────────────────────── Editable drafts (Flow A) ───────────────────────── */

export type DraftOption = { key: number; text: string; correct: boolean };
export type DraftQuestion = {
  key: number;
  text: string;
  multiple: boolean;
  mode: MultiAnswerMode;
  options: DraftOption[];
  selected: boolean;
};

let seq = 0;
const nextKey = () => ++seq;

export function toDraft(q: GeneratedQuestion): DraftQuestion {
  const options = [...(q.options ?? [])]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((o) => ({ key: nextKey(), text: o.text, correct: !!o.is_correct }));
  const correct = options.filter((o) => o.correct).length;
  return {
    key: nextKey(),
    text: q.text,
    multiple: !!q.allow_multiple_answers || correct > 1,
    mode: q.multi_answer_mode ?? "OR",
    options,
    selected: true,
  };
}

export function newDraftOption(): DraftOption {
  return { key: nextKey(), text: "", correct: false };
}

export function draftIssues(d: DraftQuestion): string[] {
  const filled = d.options.filter((o) => o.text.trim());
  const correct = filled.filter((o) => o.correct).length;
  const out: string[] = [];
  if (!d.text.trim()) out.push("Write the question");
  if (filled.length < 2) out.push("Needs at least two options");
  if (!correct) out.push("Mark the correct answer");
  else if (!d.multiple && correct > 1) out.push("Only one answer can be correct");
  return out;
}

export function draftToPayload(d: DraftQuestion, orderIndex: number): QuestionPayload {
  const options = d.options
    .filter((o) => o.text.trim())
    .map((o, i) => ({ text: o.text.trim(), is_correct: o.correct, order_index: i }));
  return {
    text: d.text.trim(),
    order_index: orderIndex,
    allow_multiple_answers: d.multiple,
    // multi_answer_mode is only allowed alongside multiple answers (§9).
    ...(d.multiple ? { multi_answer_mode: d.mode } : {}),
    options,
  };
}
