"use client";

// Small building blocks shared by the assessment editor, marking and review
// screens. Everything here is local to the Assessments workstream.

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertTriangle, Check, CloudCheck, ShieldAlert } from "lucide-react";
import { Badge, Input, Spinner, Textarea, cn } from "@/components/ui/primitives";
import type { Tone } from "@/lib/studio/labels";
import { humanize } from "@/lib/studio/labels";
import type { GeneratedQuestion, QuestionPayload, QuizQuestion } from "@/lib/studio/types";

/* ───────────────────────── Ordering ───────────────────────── */

export function byOrder<T extends { order_index?: number }>(list: T[] | undefined | null): T[] {
  return [...(list ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

export function nextOrderIndex(list: { order_index?: number }[] | undefined | null) {
  const items = list ?? [];
  if (!items.length) return 0;
  return Math.max(...items.map((i) => i.order_index ?? 0)) + 1;
}

/* ───────────────────────── Question validation ───────────────────────── */

export type QuestionIssue = { kind: "text" | "options" | "correct"; message: string };

/** The API doesn't enforce these, so the UI does (§6.5). */
export function questionIssues(q: Pick<QuizQuestion, "text" | "options">): QuestionIssue[] {
  const out: QuestionIssue[] = [];
  const options = (q.options ?? []).filter((o) => o.text?.trim());
  if (!q.text?.trim()) out.push({ kind: "text", message: "Write the question" });
  if (options.length < 2) out.push({ kind: "options", message: "Add at least two options" });
  if (!options.some((o) => o.is_correct)) out.push({ kind: "correct", message: "Mark the correct answer" });
  return out;
}

export function questionsSummary(questions: QuizQuestion[]) {
  const withIssues = questions.filter((q) => questionIssues(q).length > 0);
  return { total: questions.length, withIssues: withIssues.length };
}

/** Turn a question (existing or AI-generated) into a create payload. */
export function toQuestionPayload(q: QuizQuestion | GeneratedQuestion, orderIndex: number): QuestionPayload {
  const multiple = !!q.allow_multiple_answers;
  const payload: QuestionPayload = {
    text: q.text,
    order_index: orderIndex,
    allow_multiple_answers: multiple,
    options: byOrder(q.options ?? []).map((o, i) => ({ text: o.text, is_correct: !!o.is_correct, order_index: i })),
  };
  // multi_answer_mode is only allowed with multiple answers (§13).
  if (multiple) payload.multi_answer_mode = q.multi_answer_mode ?? "OR";
  return payload;
}

/* ───────────────────────── Save tracking ───────────────────────── */

type SaveTracker = {
  pending: number;
  lastSavedAt: number | null;
  failed: boolean;
  track: <T>(promise: Promise<T | undefined>) => Promise<T | undefined>;
};

const SaveCtx = createContext<SaveTracker | null>(null);

/** Counts in-flight writes so the editor can show a tiny "Saving…" indicator. */
export function SaveTrackerProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  const track = useCallback(async <T,>(promise: Promise<T | undefined>) => {
    setPending((n) => n + 1);
    try {
      const result = await promise;
      setFailed(result === undefined);
      setLastSavedAt(Date.now());
      return result;
    } finally {
      setPending((n) => Math.max(0, n - 1));
    }
  }, []);

  const value = useMemo(() => ({ pending, lastSavedAt, failed, track }), [pending, lastSavedAt, failed, track]);
  return <SaveCtx.Provider value={value}>{children}</SaveCtx.Provider>;
}

export function useSaveTracker() {
  const ctx = useContext(SaveCtx);
  return (
    ctx ?? {
      pending: 0,
      lastSavedAt: null,
      failed: false,
      track: <T,>(p: Promise<T | undefined>) => p,
    }
  );
}

export function SaveIndicator({ className }: { className?: string }) {
  const { pending, lastSavedAt, failed } = useSaveTracker();
  if (pending > 0) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400", className)} aria-live="polite">
        <Spinner className="h-3.5 w-3.5" />
        Saving…
      </span>
    );
  }
  if (!lastSavedAt) return null;
  if (failed) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-300", className)} aria-live="polite">
        <AlertTriangle className="h-3.5 w-3.5" />
        Last change didn&apos;t save
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400", className)} aria-live="polite">
      <CloudCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" strokeWidth={2} />
      Saved
    </span>
  );
}

/* ───────────────────────── Risk hint ───────────────────────── */

/** A subtle pill next to HIGH-risk settings on a published course. */
export function RiskHint({ show, label = "Full review" }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <span
      title="On a live course, changing this goes through full review (including the Head of Learning) before learners see it."
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20"
    >
      <ShieldAlert className="h-3 w-3" strokeWidth={2.2} />
      {label}
    </span>
  );
}

/* ───────────────────────── Inline (save-on-blur) inputs ───────────────────────── */

type InlineProps = {
  value: string;
  /** Resolve true when saved; false/undefined reverts the draft. */
  onCommit: (value: string) => Promise<boolean | undefined> | boolean | undefined;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  maxLength?: number;
  "aria-label"?: string;
  id?: string;
};

function useInlineDraft(value: string, onCommit: InlineProps["onCommit"], required?: boolean) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [prev, setPrev] = useState(value);
  // Follow the server value whenever it changes and the user isn't typing.
  if (value !== prev) {
    setPrev(value);
    if (!editing) setDraft(value);
  }

  async function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next === value.trim()) return;
    if (required && !next) {
      setDraft(value);
      return;
    }
    const ok = await onCommit(next);
    if (!ok) setDraft(value);
  }

  return {
    draft,
    setDraft,
    onFocus: () => setEditing(true),
    commit,
    reset: () => {
      setDraft(value);
      setEditing(false);
    },
  };
}

export function InlineInput({ value, onCommit, required = true, className, ...rest }: InlineProps) {
  const d = useInlineDraft(value, onCommit, required);
  return (
    <Input
      {...rest}
      value={d.draft}
      onChange={(e) => d.setDraft(e.target.value)}
      onFocus={d.onFocus}
      onBlur={d.commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          d.reset();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
}

export function InlineTextarea({ value, onCommit, required = true, className, rows = 2, ...rest }: InlineProps & { rows?: number }) {
  const d = useInlineDraft(value, onCommit, required);
  return (
    <Textarea
      {...rest}
      rows={rows}
      value={d.draft}
      onChange={(e) => d.setDraft(e.target.value)}
      onFocus={d.onFocus}
      onBlur={d.commit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).blur();
        if (e.key === "Escape") {
          d.reset();
          (e.target as HTMLTextAreaElement).blur();
        }
      }}
      className={className}
    />
  );
}

/* ───────────────────────── Essay mark statuses ───────────────────────── */

export const MARK_STATUS: Record<string, { label: string; tone: Tone; description: string }> = {
  DRAFT_MARK: { label: "Draft mark", tone: "neutral", description: "Saved by the marker, not yet sent on." },
  AWAITING_MODERATION: { label: "Awaiting moderation", tone: "info", description: "A moderator needs to check this mark." },
  MODERATED: { label: "Moderated", tone: "violet", description: "Checked by a moderator; waiting for approval." },
  APPROVED: { label: "Approved", tone: "brand", description: "Approved — ready to release to the learner." },
  PUBLISHED: { label: "Published", tone: "success", description: "The learner can see this result." },
  RETURNED_TO_MARKER: { label: "Returned to marker", tone: "warning", description: "The moderator sent it back for changes." },
  SUPERSEDED: { label: "Superseded", tone: "neutral", description: "Replaced by a later published mark." },
  DISPUTED: { label: "Disputed", tone: "danger", description: "The marker contested the moderator's amendment." },
  UNDER_APPEAL: { label: "Under appeal", tone: "warning", description: "The learner has appealed this result." },
};

export function markStatus(status?: string | null) {
  if (!status) return { label: "Not marked", tone: "neutral" as Tone, description: "Nobody has marked this yet." };
  return MARK_STATUS[status] ?? { label: humanize(status), tone: "neutral" as Tone, description: "" };
}

export function MarkStatusBadge({ status, published, size = "xs" }: { status?: string | null; published?: boolean; size?: "xs" | "sm" }) {
  const effective = status ?? (published ? "PUBLISHED" : null);
  const s = markStatus(effective);
  return (
    <Badge tone={s.tone} size={size} dot title={s.description}>
      {s.label}
    </Badge>
  );
}

/** A tiny row of ticks used in read-only option lists. */
export function CorrectMark({ correct, multiple }: { correct?: boolean; multiple?: boolean }) {
  return (
    <span
      aria-label={correct ? "Correct answer" : "Incorrect option"}
      className={cn(
        "grid h-5 w-5 flex-shrink-0 place-items-center border",
        multiple ? "rounded-md" : "rounded-full",
        correct
          ? "border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-[#06130d]"
          : "border-slate-300 bg-white dark:border-white/20 dark:bg-transparent",
      )}
    >
      {correct && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  );
}
