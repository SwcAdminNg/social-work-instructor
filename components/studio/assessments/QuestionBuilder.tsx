"use client";

import { useState } from "react";
import { AlertTriangle, Check, ListChecks, Plus, Sparkles, X } from "lucide-react";
import { Badge, Button, EmptyState, Field, Input, Segmented, Textarea, cn } from "@/components/ui/primitives";
import { studioApi } from "@/lib/studio/api";
import type { MultiAnswerMode, QuestionPayload, QuizQuestion } from "@/lib/studio/types";
import { AiQuestionGenerator } from "./AiQuestionGenerator";
import { createQuestionFor, type QuestionTarget } from "./questionTarget";
import { QuestionCard, QuestionReadCard } from "./QuestionCard";
import { byOrder, nextOrderIndex, questionsSummary, toQuestionPayload } from "./shared";
import { useAssessmentWrite } from "./useAssessmentWrite";

export function QuestionBuilder({
  questions: rawQuestions,
  target,
  readOnly,
  title = "Questions",
  description,
}: {
  questions: QuizQuestion[] | undefined;
  target: QuestionTarget;
  readOnly: boolean;
  title?: string;
  description?: React.ReactNode;
}) {
  const write = useAssessmentWrite();
  const [composerOpen, setComposerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  // Optimistic order (positions into the sorted list) until the re-fetch lands.
  const sorted = byOrder(rawQuestions);
  const [order, setOrder] = useState<number[] | null>(null);
  const [prevRaw, setPrevRaw] = useState(rawQuestions);
  if (rawQuestions !== prevRaw) {
    setPrevRaw(rawQuestions);
    setOrder(null);
  }
  const questions = order && order.length === sorted.length ? order.map((i) => sorted[i]) : sorted;
  const summary = questionsSummary(questions);

  async function move(index: number, direction: -1 | 1) {
    const to = index + direction;
    if (to < 0 || to >= questions.length) return;
    const positions = order && order.length === sorted.length ? [...order] : sorted.map((_, i) => i);
    [positions[index], positions[to]] = [positions[to], positions[index]];
    setOrder(positions);
    const next = positions.map((i) => sorted[i]);
    const ok = await write(async () => {
      for (let i = 0; i < next.length; i++) {
        if ((next[i].order_index ?? 0) !== i) await studioApi.updateQuestion(next[i].id, { order_index: i });
      }
    });
    if (!ok) setOrder(null);
  }

  async function duplicate(q: QuizQuestion) {
    await write(() => createQuestionFor(target, toQuestionPayload(q, nextOrderIndex(sorted))), {
      success: "Question duplicated — added at the end",
    });
  }

  if (readOnly) {
    return (
      <section className="flex flex-col gap-3">
        <BuilderHeader title={title} description={description} count={questions.length} issues={summary.withIssues} />
        {questions.length ? (
          questions.map((q, i) => <QuestionReadCard key={i} question={q} index={i} />)
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-ink-line dark:text-slate-400">
            No questions yet.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <BuilderHeader
        title={title}
        description={description}
        count={questions.length}
        issues={summary.withIssues}
        actions={
          questions.length > 0 && (
            <Button variant="outline" size="sm" icon={Sparkles} onClick={() => setAiOpen(true)}>
              Generate with AI
            </Button>
          )
        }
      />

      {questions.length === 0 && !composerOpen ? (
        <EmptyState
          compact
          icon={ListChecks}
          title="No questions yet"
          description="Write your own, or let AI draft questions from a topic or a document for you to review."
          action={
            <>
              <Button size="sm" icon={Plus} onClick={() => setComposerOpen(true)}>
                Write a question
              </Button>
              <Button size="sm" variant="secondary" icon={Sparkles} onClick={() => setAiOpen(true)}>
                Generate with AI
              </Button>
            </>
          }
        />
      ) : (
        questions.map((q, i) => (
          <QuestionCard
            key={i}
            question={q}
            index={i}
            total={questions.length}
            onMove={(d) => move(i, d)}
            onDuplicate={() => duplicate(q)}
          />
        ))
      )}

      {composerOpen ? (
        <QuestionComposer
          number={questions.length + 1}
          onCancel={() => setComposerOpen(false)}
          onCreate={async (payload) => {
            const ok = await write(() => createQuestionFor(target, { ...payload, order_index: nextOrderIndex(sorted) }), {
              success: "Question added",
            });
            return ok;
          }}
        />
      ) : (
        questions.length > 0 && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700 dark:border-ink-line dark:text-slate-400 dark:hover:border-brand-400/50 dark:hover:bg-brand-400/5 dark:hover:text-brand-300"
          >
            <Plus className="h-4 w-4" />
            Add question
          </button>
        )
      )}

      <AiQuestionGenerator open={aiOpen} onOpenChange={setAiOpen} target={target} existing={sorted} />
    </section>
  );
}

function BuilderHeader({
  title,
  description,
  count,
  issues,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  count: number;
  issues: number;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-[15px] font-bold text-slate-900 dark:text-white">{title}</h3>
          <Badge size="xs" tone="neutral">
            {count}
          </Badge>
          {issues > 0 ? (
            <Badge size="xs" tone="warning" icon={AlertTriangle}>
              {issues} need{issues === 1 ? "s" : ""} attention
            </Badge>
          ) : (
            count > 0 && (
              <Badge size="xs" tone="success" icon={Check}>
                All complete
              </Badge>
            )
          )}
        </div>
        {description && <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/* ───────────────────────── New question composer ───────────────────────── */

type DraftOption = { text: string; correct: boolean };

function QuestionComposer({
  number,
  onCancel,
  onCreate,
}: {
  number: number;
  onCancel: () => void;
  onCreate: (payload: QuestionPayload) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const [multiple, setMultiple] = useState(false);
  const [mode, setMode] = useState<MultiAnswerMode>("OR");
  const [options, setOptions] = useState<DraftOption[]>(() => Array.from({ length: 4 }, () => ({ text: "", correct: false })));
  const [saving, setSaving] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);

  const filled = options.filter((o) => o.text.trim());
  const problems = [
    !text.trim() && "Write the question",
    filled.length < 2 && "Add at least two options",
    !filled.some((o) => o.correct) && "Mark the correct answer",
  ].filter(Boolean) as string[];

  function update(i: number, patch: Partial<DraftOption>) {
    setOptions((prev) =>
      prev.map((o, j) => {
        if (j === i) return { ...o, ...patch };
        // A single-answer question has exactly one correct option.
        if (patch.correct && !multiple) return { ...o, correct: false };
        return o;
      }),
    );
  }

  function changeMultiple(next: boolean) {
    setMultiple(next);
    if (!next) {
      let seen = false;
      setOptions((prev) =>
        prev.map((o) => {
          if (o.correct && !seen) {
            seen = true;
            return o;
          }
          return { ...o, correct: false };
        }),
      );
    }
  }

  async function save() {
    if (problems.length) return;
    setSaving(true);
    const ok = await onCreate({
      text: text.trim(),
      allow_multiple_answers: multiple,
      ...(multiple ? { multi_answer_mode: mode } : {}),
      options: filled.map((o, i) => ({ text: o.text.trim(), is_correct: o.correct, order_index: i })),
    });
    setSaving(false);
    if (!ok) return;
    if (keepOpen) {
      setText("");
      setOptions(Array.from({ length: 4 }, () => ({ text: "", correct: false })));
    } else onCancel();
  }

  return (
    <div className="animate-pop-in rounded-xl border border-brand-200 bg-white p-4 ring-4 ring-brand-400/10 dark:border-brand-500/30 dark:bg-ink-surface">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">New question {number}</p>
        <Button variant="ghost" size="xs" iconOnly icon={X} aria-label="Cancel new question" onClick={onCancel} />
      </div>
      <Field label="Question" htmlFor={`new-q-${number}`} className="mt-2">
        <Textarea
          id={`new-q-${number}`}
          rows={2}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Who is responsible for safeguarding in your organisation?"
        />
      </Field>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={multiple ? "multi" : "single"}
          onChange={(k) => changeMultiple(k === "multi")}
          options={[
            { key: "single", label: "One answer" },
            { key: "multi", label: "Several answers" },
          ]}
        />
        {multiple && (
          <Segmented<MultiAnswerMode>
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { key: "OR", label: "Partial credit" },
              { key: "AND", label: "All or nothing" },
            ]}
          />
        )}
      </div>

      <p className="mt-4 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        Options <span className="font-normal text-slate-400">· tick the correct {multiple ? "answers" : "answer"}</span>
      </p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {options.map((o, i) => (
          <li key={i} className="flex items-center gap-2">
            <button
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={o.correct}
              aria-label={`Option ${i + 1} is correct`}
              onClick={() => update(i, { correct: multiple ? !o.correct : true })}
              className={cn(
                "grid h-6 w-6 flex-shrink-0 cursor-pointer place-items-center border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60",
                multiple ? "rounded-md" : "rounded-full",
                o.correct
                  ? "border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-[#06130d]"
                  : "border-slate-300 bg-white text-transparent hover:border-brand-400 hover:text-brand-300 dark:border-white/20 dark:bg-transparent",
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
            <Input
              aria-label={`Option ${i + 1}`}
              value={o.text}
              maxLength={500}
              placeholder={`Option ${i + 1}`}
              className="h-9"
              onChange={(e) => update(i, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (i === options.length - 1 && options.length < 8) setOptions((p) => [...p, { text: "", correct: false }]);
                  const next = (e.currentTarget.closest("li")?.nextElementSibling?.querySelector("input") ?? null) as HTMLInputElement | null;
                  requestAnimationFrame(() => next?.focus());
                }
              }}
            />
            <Button
              variant="ghost"
              size="xs"
              iconOnly
              icon={X}
              aria-label={`Remove option ${i + 1}`}
              disabled={options.length <= 2}
              onClick={() => setOptions((p) => p.filter((_, j) => j !== i))}
            />
          </li>
        ))}
      </ul>
      {options.length < 8 && (
        <Button
          variant="ghost"
          size="xs"
          icon={Plus}
          className="mt-1.5"
          onClick={() => setOptions((p) => [...p, { text: "", correct: false }])}
        >
          Add option
        </Button>
      )}

      <div className="mt-4 flex flex-col-reverse gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-ink-line">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <input
            type="checkbox"
            checked={keepOpen}
            onChange={(e) => setKeepOpen(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-600 dark:accent-brand-400"
          />
          Add another after saving
        </label>
        <div className="flex items-center gap-2">
          {problems.length > 0 && (
            <span className="text-xs text-slate-400" aria-live="polite">
              {problems[0]}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" icon={Check} loading={saving} disabled={problems.length > 0} onClick={save}>
            Save question
          </Button>
        </div>
      </div>
    </div>
  );
}
