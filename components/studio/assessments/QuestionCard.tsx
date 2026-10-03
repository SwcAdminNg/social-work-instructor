"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Copy, Ellipsis, Plus, Trash2, X } from "lucide-react";
import { Badge, Button, Input, Segmented, cn } from "@/components/ui/primitives";
import { ConfirmDialog, Menu } from "@/components/ui/overlays";
import { studioApi } from "@/lib/studio/api";
import type { MultiAnswerMode, QuizOption, QuizQuestion } from "@/lib/studio/types";
import { CorrectMark, InlineInput, InlineTextarea, byOrder, nextOrderIndex, questionIssues } from "./shared";
import { useAssessmentWrite } from "./useAssessmentWrite";

/* ───────────────────────── Read-only ───────────────────────── */

export function QuestionReadCard({ question, index }: { question: QuizQuestion; index: number }) {
  const options = byOrder(question.options);
  const multiple = !!question.allow_multiple_answers;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-ink-line dark:bg-ink-surface">
      <div className="flex items-start gap-3">
        <QuestionNumber n={index + 1} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">{question.text}</p>
          {multiple && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Multiple answers · {question.multi_answer_mode === "AND" ? "all correct answers required" : "partial credit"}
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-1.5">
            {options.map((o, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg px-2.5 py-1.5 text-sm",
                  o.is_correct
                    ? "bg-brand-50/70 font-medium text-brand-800 dark:bg-brand-400/10 dark:text-brand-200"
                    : "text-slate-600 dark:text-slate-300",
                )}
              >
                <CorrectMark correct={o.is_correct} multiple={multiple} />
                <span className="min-w-0 break-words">{o.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function QuestionNumber({ n, warn }: { n: number; warn?: boolean }) {
  return (
    <span
      className={cn(
        "grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-xs font-bold",
        warn
          ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25"
          : "bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300",
      )}
    >
      {n}
    </span>
  );
}

/* ───────────────────────── Editable ───────────────────────── */

export function QuestionCard({
  question,
  index,
  total,
  onMove,
  onDuplicate,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
}) {
  const write = useAssessmentWrite();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [adding, setAdding] = useState(false);

  // Optimistic "correct" flags (by option position) until the re-fetch lands.
  const [optimistic, setOptimistic] = useState<Record<number, boolean> | null>(null);
  const [prevQuestion, setPrevQuestion] = useState(question);
  if (question !== prevQuestion) {
    setPrevQuestion(question);
    setOptimistic(null);
  }

  const options = byOrder(question.options);
  const multiple = !!question.allow_multiple_answers;
  const isCorrect = (o: QuizOption, i: number) => (optimistic && i in optimistic ? optimistic[i] : !!o.is_correct);
  const issues = questionIssues({ text: question.text, options: options.map((o, i) => ({ ...o, is_correct: isCorrect(o, i) })) });

  async function toggleCorrect(option: QuizOption, i: number) {
    if (multiple) {
      const next = !isCorrect(option, i);
      setOptimistic((prev) => ({ ...(prev ?? {}), [i]: next }));
      const ok = await write(() => studioApi.updateOption(option.id, { is_correct: next }));
      if (!ok) setOptimistic(null);
      return;
    }
    if (isCorrect(option, i)) return;
    const others = options.filter((o, j) => j !== i && isCorrect(o, j));
    setOptimistic(Object.fromEntries(options.map((_, j) => [j, j === i])));
    const ok = await write(async () => {
      await studioApi.updateOption(option.id, { is_correct: true });
      for (const o of others) await studioApi.updateOption(o.id, { is_correct: false });
    });
    if (!ok) setOptimistic(null);
  }

  async function setMultiple(next: boolean) {
    if (next === multiple) return;
    if (next) {
      await write(() => studioApi.updateQuestion(question.id, { allow_multiple_answers: true, multi_answer_mode: "OR" }));
      return;
    }
    // Back to a single answer: keep the first correct option only.
    const correct = options.filter((o, i) => isCorrect(o, i));
    await write(async () => {
      await studioApi.updateQuestion(question.id, { allow_multiple_answers: false });
      for (const o of correct.slice(1)) await studioApi.updateOption(o.id, { is_correct: false });
    });
  }

  async function addOption() {
    const text = newOption.trim();
    if (!text) return;
    setAdding(true);
    const ok = await write(() =>
      studioApi.createOption(question.id, { text, is_correct: false, order_index: nextOrderIndex(options) }),
    );
    setAdding(false);
    if (ok) setNewOption("");
  }

  return (
    <div
      className={cn(
        "group rounded-xl border bg-white p-4 transition-colors dark:bg-ink-surface",
        issues.length
          ? "border-amber-200 dark:border-amber-500/25"
          : "border-slate-200/80 hover:border-slate-300 dark:border-ink-line dark:hover:border-white/15",
      )}
    >
      <div className="flex items-start gap-3">
        <QuestionNumber n={index + 1} warn={issues.length > 0} />
        <div className="min-w-0 flex-1">
          <InlineTextarea
            aria-label={`Question ${index + 1}`}
            value={question.text ?? ""}
            rows={2}
            placeholder="Write the question…"
            onCommit={(text) => write(() => studioApi.updateQuestion(question.id, { text }))}
            className="border-transparent bg-transparent px-2 py-1.5 font-semibold shadow-none hover:border-slate-200 focus:bg-white dark:bg-transparent dark:hover:border-ink-line dark:focus:bg-ink-page/60"
          />
        </div>
        <Menu
          trigger={<Button variant="ghost" size="sm" iconOnly icon={Ellipsis} aria-label={`Question ${index + 1} options`} />}
          items={[
            { label: "Move up", icon: ArrowUp, onSelect: () => onMove(-1), disabled: index === 0 },
            { label: "Move down", icon: ArrowDown, onSelect: () => onMove(1), disabled: index === total - 1 },
            { label: "Duplicate", icon: Copy, onSelect: onDuplicate },
            "separator",
            { label: "Delete question", icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) },
          ]}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-10">
        <Segmented
          size="sm"
          value={multiple ? "multi" : "single"}
          onChange={(k) => setMultiple(k === "multi")}
          options={[
            { key: "single", label: "One answer" },
            { key: "multi", label: "Several answers" },
          ]}
        />
        {multiple && (
          <Segmented<MultiAnswerMode>
            size="sm"
            value={question.multi_answer_mode ?? "OR"}
            onChange={(mode) => write(() => studioApi.updateQuestion(question.id, { multi_answer_mode: mode }))}
            options={[
              { key: "OR", label: "Partial credit" },
              { key: "AND", label: "All or nothing" },
            ]}
          />
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-1.5 pl-10" aria-label="Options">
        {options.map((o, i) => {
          const correct = isCorrect(o, i);
          return (
            <li key={i} className="group/opt flex items-center gap-2">
              <button
                type="button"
                role={multiple ? "checkbox" : "radio"}
                aria-checked={correct}
                aria-label={correct ? "Correct answer" : "Mark as correct"}
                title={correct ? "Correct answer" : "Mark as correct"}
                onClick={() => toggleCorrect(o, i)}
                className={cn(
                  "grid h-6 w-6 flex-shrink-0 cursor-pointer place-items-center border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
                  multiple ? "rounded-md" : "rounded-full",
                  correct
                    ? "border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-[#06130d]"
                    : "border-slate-300 bg-white text-transparent hover:border-brand-400 hover:text-brand-300 dark:border-white/20 dark:bg-transparent",
                )}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
              <InlineInput
                aria-label={`Option ${i + 1}`}
                value={o.text ?? ""}
                maxLength={500}
                onCommit={(text) => write(() => studioApi.updateOption(o.id, { text }))}
                className={cn(
                  "h-9 border-transparent bg-transparent shadow-none hover:border-slate-200 focus:bg-white dark:bg-transparent dark:hover:border-ink-line dark:focus:bg-ink-page/60",
                  correct && "font-medium text-brand-800 dark:text-brand-200",
                )}
              />
              <Button
                variant="ghost"
                size="xs"
                iconOnly
                icon={X}
                aria-label={`Remove option ${i + 1}`}
                className="opacity-60 group-hover/opt:opacity-100 focus-visible:opacity-100"
                onClick={() => write(() => studioApi.deleteOption(o.id))}
              />
            </li>
          );
        })}
        <li className="flex items-center gap-2">
          <span className="grid h-6 w-6 flex-shrink-0 place-items-center text-slate-400">
            <Plus className="h-4 w-4" />
          </span>
          <Input
            aria-label="Add an option"
            value={newOption}
            maxLength={500}
            disabled={adding}
            placeholder="Add an option…"
            onChange={(e) => setNewOption(e.target.value)}
            onBlur={addOption}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption();
              }
            }}
            className="h-9 border-dashed shadow-none"
          />
        </li>
      </ul>

      {issues.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-10">
          {issues.map((issue) => (
            <Badge key={issue.kind} tone="warning" size="xs" icon={AlertTriangle}>
              {issue.message}
            </Badge>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this question?"
        description="The question and its options will be removed from this assessment."
        confirmLabel="Delete question"
        onConfirm={async () => {
          const ok = await write(() => studioApi.deleteQuestion(question.id), { success: "Question deleted" });
          if (!ok) throw new Error("failed");
        }}
      />
    </div>
  );
}
