"use client";

// "Generate with AI" for a quiz or one quiz-group pool
// (AI_ASSESSMENT_AUTHORING_API.md). Two flows:
//   A. Review before adding (default): persist=false → editable drafts → save the kept ones.
//   B. Add straight away: persist=true → questions saved → reorder after the existing ones → Undo.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileText,
  FileUp,
  Lightbulb,
  Minus,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Callout, Field, Input, ProgressBar, Segmented, Select, Switch, Textarea, cn } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/overlays";
import { useCourseEditor } from "@/components/studio/editor/CourseEditorContext";
import { studioApi } from "@/lib/studio/api";
import { formatBytes } from "@/lib/studio/labels";
import type { AiGeneratePayload, AiGenerateResult, AiProvider, QuizQuestion } from "@/lib/studio/types";
import { AiDraftCard } from "./AiDraftCard";
import {
  LIMITS,
  PROMPT_TIPS,
  PROVIDERS,
  classifyAiError,
  draftIssues,
  draftToPayload,
  providerLabel,
  toDraft,
  validateDocument,
  type AiFailure,
  type DraftQuestion,
} from "./aiAuthoring";
import { createQuestionFor, type QuestionTarget } from "./questionTarget";
import { CorrectMark, byOrder, nextOrderIndex } from "./shared";

type Mode = "topic" | "document";
type Phase = "form" | "generating" | "review" | "added";

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const LOADING_LINES = [
  "Reading your brief…",
  "Picking out the key ideas…",
  "Drafting questions…",
  "Writing believable wrong answers…",
  "Checking every answer…",
  "Polishing the wording…",
];

const AI_NOTICE = "AI-generated. Check every question and the marked correct answers before submitting for review.";

export function AiQuestionGenerator({
  open,
  onOpenChange,
  target,
  existing,
  drawCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: QuestionTarget;
  existing: QuizQuestion[];
  /** Quiz-group pools: how many questions each attempt draws (§7.3). */
  drawCount?: number | null;
}) {
  const { run, refresh, lifecycle, governanceEnabled } = useCourseEditor();
  const liveCourse = lifecycle === "PUBLISHED" && governanceEnabled;

  // Form
  const [mode, setMode] = useState<Mode>("topic");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [count, setCount] = useState(() => (drawCount ? Math.min(LIMITS.countMax, Math.max(10, drawCount * 2)) : 10));
  const [perQuestion, setPerQuestion] = useState(4);
  const [review, setReview] = useState(true);
  const [provider, setProvider] = useState<AiProvider>("GEMINI");
  const [model, setModel] = useState("");
  const [advanced, setAdvanced] = useState(false);

  // Flow
  const [phase, setPhase] = useState<Phase>("form");
  const [failure, setFailure] = useState<AiFailure | null>(null);
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);
  const [saving, setSaving] = useState<{ done: number; total: number } | null>(null);
  const [created, setCreated] = useState<QuizQuestion[]>([]);
  const [undoing, setUndoing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const busy = phase === "generating" || !!saving || undoing;
  const kept = drafts.filter((d) => d.selected);
  const invalidKept = kept.filter((d) => draftIssues(d).length > 0).length;
  const canGenerate = mode === "topic" ? prompt.trim().length > 0 && prompt.length <= LIMITS.promptMax : !!file && !fileError;
  const where = target.kind === "group" ? "pool" : "quiz";

  function backToForm() {
    setPhase("form");
    setResult(null);
    setDrafts([]);
    setCreated([]);
  }

  function close() {
    if (busy) return;
    onOpenChange(false);
    // Keep the brief and file so reopening is quick; drop results.
    backToForm();
    setFailure(null);
  }

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    setFile(f);
    setFileError(validateDocument(f));
    setFailure(null);
  }

  async function generate(useProvider: AiProvider = provider) {
    if (!canGenerate) return;
    if (useProvider !== provider) setProvider(useProvider);
    const controller = new AbortController();
    abortRef.current = controller;
    setFailure(null);
    setPhase("generating");

    const payload: AiGeneratePayload = {
      question_count: Math.min(LIMITS.countMax, Math.max(LIMITS.countMin, count)),
      options_per_question: Math.min(LIMITS.optionsMax, Math.max(LIMITS.optionsMin, perQuestion)),
      persist: !review,
      provider: useProvider,
      ...(model.trim() ? { model: model.trim() } : {}),
    };
    const call = () => {
      const opts = { signal: controller.signal };
      if (mode === "document" && file) {
        return target.kind === "quiz"
          ? studioApi.aiAutocomplete(target.itemId, { ...payload, file }, opts)
          : studioApi.groupAiAutocomplete(target.sectionId, { ...payload, file }, opts);
      }
      const body = { ...payload, prompt: prompt.trim() };
      return target.kind === "quiz" ? studioApi.aiGenerate(target.itemId, body, opts) : studioApi.groupAiGenerate(target.sectionId, body, opts);
    };

    try {
      // run() turns a 409 into the editor's read-only lock; silent → we show the error here.
      const res = await run(call, { refresh: false, silent: true });
      if (!res) throw new Error("No response");
      setResult(res);
      if (review) {
        setDrafts((res.generated_questions ?? []).map(toDraft));
        setPhase("review");
      } else {
        await placeAfterExisting(res.created_questions ?? []);
        setPhase("added");
      }
    } catch (err) {
      const f = classifyAiError(err, { mode, persist: !review, provider: useProvider });
      // A 409 locks the editor, which closes this dialog — say why.
      if (f.kind === "locked" || f.kind === "permission") toast.error(f.message);
      // With persist=true a client-side timeout/cancel may still have saved a batch (§10).
      if (!review && (f.kind === "timeout" || f.kind === "aborted")) await refresh();
      setFailure(f.kind === "aborted" && review ? null : f);
      if (f.kind === "file" && mode === "document") setFileError(f.message);
      setPhase("form");
    } finally {
      abortRef.current = null;
    }
  }

  /** Flow B: a batch is numbered 0…n-1, so move it after the existing questions (§10). */
  async function placeAfterExisting(questions: QuizQuestion[]) {
    const start = nextOrderIndex(existing);
    const sorted = byOrder(questions);
    setCreated(sorted);
    await run(
      async () => {
        for (let i = 0; i < sorted.length; i++) {
          if ((sorted[i].order_index ?? 0) !== start + i) await studioApi.updateQuestion(sorted[i].id, { order_index: start + i });
        }
      },
      { refresh: true },
    );
  }

  /** Flow A: save the kept drafts one by one, after the existing questions. */
  async function addKept() {
    if (!kept.length || invalidKept) return;
    const start = nextOrderIndex(existing);
    const queue = [...kept];
    setSaving({ done: 0, total: queue.length });
    const saved = new Set<number>();
    try {
      for (let i = 0; i < queue.length; i++) {
        await run(() => createQuestionFor(target, draftToPayload(queue[i], start + i)), { refresh: false, silent: true });
        saved.add(queue[i].key);
        setSaving({ done: i + 1, total: queue.length });
      }
    } catch (err) {
      const f = classifyAiError(err, { mode, persist: false, provider });
      toast.error(saved.size ? `Added ${saved.size} of ${queue.length}. ${f.message}` : f.message);
      // Keep only what still needs saving so a retry doesn't duplicate.
      setDrafts((prev) => prev.filter((d) => !saved.has(d.key)));
    } finally {
      setSaving(null);
      await refresh();
    }
    if (saved.size === queue.length) {
      toast.success(`Added ${queue.length} question${queue.length === 1 ? "" : "s"} to the ${where}`);
      close();
    }
  }

  /** Flow B undo: the API has no batch undo, so delete each returned id (§7.2). */
  async function undo() {
    setUndoing(true);
    const ok = await run(
      async () => {
        for (const q of created) await studioApi.deleteQuestion(q.id);
        return true;
      },
      { success: `Removed ${created.length} question${created.length === 1 ? "" : "s"}` },
    );
    setUndoing(false);
    if (ok) close();
  }

  const title =
    phase === "review" ? "Review the drafted questions" : phase === "added" ? "Questions added" : "Generate questions with AI";
  const description =
    phase === "review"
      ? "Nothing is saved yet. Edit anything, untick what you don't want, then add the rest."
      : phase === "added"
        ? undefined
        : target.kind === "group"
          ? "Fill this pool from a topic or your own material."
          : "Draft multiple-choice questions from a topic or your own material.";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(true) : close())}
      dismissible={!busy}
      size="lg"
      icon={phase === "added" ? CheckCircle2 : Sparkles}
      iconTone={phase === "added" ? "brand" : "violet"}
      title={title}
      description={description}
      footer={
        phase === "generating" ? (
          <Button variant="outline" icon={X} onClick={() => abortRef.current?.abort()}>
            Cancel
          </Button>
        ) : phase === "review" ? (
          <>
            <Button variant="outline" icon={ArrowLeft} onClick={backToForm} disabled={!!saving}>
              Start over
            </Button>
            <Button icon={Plus} loading={!!saving} disabled={!kept.length || invalidKept > 0} onClick={addKept}>
              {saving ? `Adding ${saving.done + 1} of ${saving.total}…` : `Add ${kept.length} to ${where}`}
            </Button>
          </>
        ) : phase === "added" ? (
          <>
            <Button variant="outline" icon={Undo2} loading={undoing} onClick={undo}>
              Undo
            </Button>
            <Button onClick={close} disabled={undoing}>
              Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button icon={Sparkles} disabled={!canGenerate} onClick={() => generate()}>
              {review ? "Generate & review" : `Generate & add ${count}`}
            </Button>
          </>
        )
      }
    >
      {phase === "generating" && <GeneratingState mode={mode} provider={provider} persist={!review} />}

      {phase === "form" && (
        <div className="flex flex-col gap-5">
          {failure && <FailureCallout failure={failure} provider={provider} onRetry={(p) => generate(p)} canRetry={canGenerate} />}

          {liveCourse && (
            <Callout tone="warning" icon={ShieldAlert} title="Adding questions sends this course through full review">
              New questions are a high-risk change and include assessment moderation. Even a preview opens your draft of
              changes and lists you as a contributor, so you won&apos;t be able to approve this revision yourself.
            </Callout>
          )}

          <Segmented<Mode>
            value={mode}
            onChange={(m) => {
              setMode(m);
              setFailure(null);
            }}
            className="self-start"
            options={[
              { key: "topic", label: "From a topic", icon: Lightbulb },
              { key: "document", label: "From a document", icon: FileText },
            ]}
          />

          {mode === "topic" ? (
            <Field
              label="What should the questions cover?"
              htmlFor="ai-prompt"
              aside={
                <span className={cn("text-xs tabular-nums", prompt.length > LIMITS.promptMax ? "text-rose-600" : "text-slate-400")}>
                  {prompt.length.toLocaleString()} / {LIMITS.promptMax.toLocaleString()}
                </span>
              }
              hint="The AI also sees your course, module and quiz titles, so you don't need to repeat them."
            >
              <Textarea
                id="ai-prompt"
                rows={4}
                value={prompt}
                maxLength={LIMITS.promptMax}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  "e.g. Recognising signs of neglect in children under five.\n" +
                  "Scenario-based, beginner level, include one question with more than one correct answer."
                }
              />
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_TIPS.map((tip) => {
                  const used = prompt.includes(tip.text);
                  return (
                    <button
                      key={tip.label}
                      type="button"
                      disabled={used}
                      onClick={() => setPrompt((p) => (p.trim() ? `${p.trim()} ${tip.text}` : tip.text))}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        used
                          ? "cursor-default border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-400/10 dark:text-brand-300"
                          : "border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-ink-line dark:text-slate-300 dark:hover:border-violet-400/40 dark:hover:bg-violet-500/10 dark:hover:text-violet-300",
                      )}
                    >
                      {used ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {tip.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          ) : (
            <DocumentPicker file={file} error={fileError} onPick={pickFile} onClear={() => {
                setFile(null);
                setFileError(null);
              }} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of questions" hint="The AI may return fewer if the material is thin.">
              <Stepper value={count} min={LIMITS.countMin} max={LIMITS.countMax} onChange={setCount} label="Number of questions" />
            </Field>
            <Field label="Answer options per question">
              <Stepper value={perQuestion} min={LIMITS.optionsMin} max={LIMITS.optionsMax} onChange={setPerQuestion} label="Options per question" />
            </Field>
          </div>

          {drawCount ? (
            <p
              className={cn(
                "-mt-2 flex items-start gap-2 text-xs leading-5",
                existing.length + count <= drawCount ? "text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400",
              )}
            >
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              Each attempt draws {drawCount} from this pool ({existing.length} in it now). Generate more than that so learners see
              different questions each time.
            </p>
          ) : null}

          <div className="rounded-xl border border-slate-200 p-4 dark:border-ink-line">
            <Switch
              checked={review}
              onChange={setReview}
              label="Review before adding"
              description={
                review
                  ? "See and edit every question first, then choose which to keep. Recommended."
                  : `Questions go into the ${where} straight away. You can edit them afterwards, or undo the whole batch.`
              }
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setAdvanced((v) => !v)}
              aria-expanded={advanced}
              className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} />
              Advanced: AI provider
              <Badge size="xs" tone="violet" className="ml-1">
                {providerLabel(provider)}
              </Badge>
            </button>
            {advanced && (
              <div className="mt-3 grid animate-pop-in gap-4 sm:grid-cols-2">
                <Field label="Provider" htmlFor="ai-provider" hint="Switch if one is slow or unavailable.">
                  <Select id="ai-provider" value={provider} onChange={(e) => setProvider(e.target.value as AiProvider)}>
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                        {p.value === "GEMINI" ? " (default)" : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Model" optional htmlFor="ai-model" hint="Leave blank unless an administrator gave you one.">
                  <Input
                    id="ai-model"
                    value={model}
                    maxLength={100}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={PROVIDERS.find((p) => p.value === provider)?.defaultModel}
                  />
                </Field>
              </div>
            )}
          </div>

          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-500" />
            AI drafts can be wrong. You stay in control: every question can be edited or deleted, and it still goes through
            course review before learners see it.
          </p>
        </div>
      )}

      {phase === "review" && result && (
        <ReviewPhase
          result={result}
          requested={count}
          drafts={drafts}
          setDrafts={setDrafts}
          saving={saving}
          invalidKept={invalidKept}
          onRetry={backToForm}
        />
      )}

      {phase === "added" && result && <AddedPhase result={result} created={created} where={where} />}
    </Dialog>
  );
}

/* ───────────────────────── Pieces ───────────────────────── */

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min));
  return (
    <div className="flex h-10 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] dark:border-ink-line dark:bg-ink-page/60">
      <button
        type="button"
        aria-label={`Fewer: ${label}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="grid w-10 cursor-pointer place-items-center text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="w-full min-w-0 border-x border-slate-200 bg-transparent text-center text-sm font-semibold tabular-nums text-slate-900 outline-none [appearance:textfield] dark:border-ink-line dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`More: ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="grid w-10 cursor-pointer place-items-center text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function DocumentPicker({
  file,
  error,
  onPick,
  onClear,
}: {
  file: File | null;
  error: string | null;
  onPick: (f: File | null | undefined) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Choose a PDF or Word document"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {file ? (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-white p-3 dark:bg-ink-surface",
            error ? "border-rose-300 dark:border-rose-500/40" : "border-slate-200 dark:border-ink-line",
          )}
        >
          <span
            className={cn(
              "grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg",
              error ? "bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-300" : "bg-violet-50 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300",
            )}
          >
            {error ? <AlertTriangle className="h-5 w-5" /> : <FileText className="h-5 w-5" strokeWidth={1.9} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
            <p className={cn("text-xs", error ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400")}>
              {error ?? formatBytes(file.size)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => input.current?.click()}>
            Replace
          </Button>
          <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Remove document" onClick={onClear} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onPick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-9 text-center transition",
            dragging
              ? "border-violet-400 bg-violet-50/60 dark:bg-violet-500/10"
              : "border-slate-300 hover:border-violet-300 hover:bg-violet-50/30 dark:border-ink-line dark:hover:border-violet-400/40 dark:hover:bg-violet-500/5",
          )}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300">
            <FileUp className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Drop your notes, a policy or a past paper</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">or click to browse · PDF or Word (.docx) · up to 10 MB</span>
        </button>
      )}
      <ul className="grid gap-1 text-xs leading-5 text-slate-500 sm:grid-cols-2 dark:text-slate-400">
        <li>• It doesn&apos;t need to be in question format.</li>
        <li>• Only the first 40,000 characters are read. For long documents, upload the chapter you need.</li>
        <li>• Scanned or image-only PDFs need OCR first.</li>
        <li>• The file is read once and not stored.</li>
      </ul>
    </div>
  );
}

function FailureCallout({
  failure,
  provider,
  onRetry,
  canRetry,
}: {
  failure: AiFailure;
  provider: AiProvider;
  onRetry: (provider: AiProvider) => void;
  canRetry: boolean;
}) {
  const others = PROVIDERS.filter((p) => p.value !== provider);
  const tone = failure.kind === "aborted" ? "neutral" : failure.kind === "locked" || failure.kind === "permission" ? "warning" : "danger";
  return (
    <Callout tone={tone} icon={AlertTriangle} title={failure.title}>
      <p>{failure.message}</p>
      {(failure.retryable || failure.switchProvider) && canRetry && (
        <div className="mt-3 flex flex-wrap gap-2">
          {failure.retryable && (
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => onRetry(provider)}>
              Try again
            </Button>
          )}
          {failure.switchProvider &&
            others.map((p) => (
              <Button key={p.value} size="sm" variant="ghost" icon={Sparkles} onClick={() => onRetry(p.value)}>
                Try {p.label}
              </Button>
            ))}
        </div>
      )}
    </Callout>
  );
}

function GeneratingState({ mode, provider, persist }: { mode: Mode; provider: AiProvider; persist: boolean }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const line = Math.min(Math.floor(seconds / 5), LOADING_LINES.length - 1);
  const text = mode === "document" && line === 0 ? "Reading your document…" : LOADING_LINES[line];
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center" aria-live="polite">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-violet-400/20" />
        <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-lg">
          <Sparkles className="h-7 w-7 animate-pulse" strokeWidth={1.8} />
        </span>
      </div>
      <div>
        <p className="font-display text-base font-bold text-slate-900 dark:text-white">{text}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {providerLabel(provider)} · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} · usually under a minute
        </p>
      </div>
      <ProgressBar value={Math.min(95, (seconds / 60) * 100)} tone="violet" className="max-w-xs" />
      {seconds > 45 && (
        <p className="max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
          Taking a little longer than usual. You can keep waiting, or cancel and try fewer questions or another provider.
          {persist && " If you cancel, some questions may still be added."}
        </p>
      )}
    </div>
  );
}

function SourceInfo({ result }: { result: AiGenerateResult }) {
  return (
    <div className="flex flex-col gap-3">
      {result.extracted_text_preview && (
        <details className="group rounded-xl border border-slate-200 bg-slate-50/70 dark:border-ink-line dark:bg-white/[0.02]">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <FileText className="h-4 w-4 text-violet-500" />
            <span className="min-w-0 truncate">What the AI read{result.source_file_name ? ` from ${result.source_file_name}` : ""}</span>
            <span className="ml-auto flex-shrink-0 text-xs font-normal text-slate-400">
              <span className="group-open:hidden">Check it</span>
              <span className="hidden group-open:inline">Hide</span>
            </span>
          </summary>
          <p className="max-h-48 overflow-y-auto whitespace-pre-wrap border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-ink-line dark:text-slate-300">
            {result.extracted_text_preview}
            <span className="mt-2 block text-slate-400">If this looks garbled or isn&apos;t your document, start over with a different file.</span>
          </p>
        </details>
      )}
      <Callout tone="violet" icon={Sparkles}>
        {AI_NOTICE}
      </Callout>
    </div>
  );
}

function ReviewPhase({
  result,
  requested,
  drafts,
  setDrafts,
  saving,
  invalidKept,
  onRetry,
}: {
  result: AiGenerateResult;
  requested: number;
  drafts: DraftQuestion[];
  setDrafts: React.Dispatch<React.SetStateAction<DraftQuestion[]>>;
  saving: { done: number; total: number } | null;
  invalidKept: number;
  onRetry: () => void;
}) {
  const kept = drafts.filter((d) => d.selected).length;
  const returned = result.generated_questions?.length ?? 0;
  const allSelected = drafts.length > 0 && kept === drafts.length;

  if (!drafts.length) {
    return (
      <Callout
        tone="warning"
        icon={AlertTriangle}
        title={returned ? "You've discarded every question" : "No questions came back"}
        actions={
          <Button size="sm" variant="outline" icon={RefreshCw} onClick={onRetry}>
            Start over
          </Button>
        }
      >
        {returned
          ? "Start over to generate a new batch."
          : "Try a more specific topic, another provider, or a document with more text."}
      </Callout>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SourceInfo result={result} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span>
            <span className="font-semibold text-slate-900 dark:text-white">{kept}</span> of {drafts.length} selected
          </span>
          {result.model && (
            <Badge size="xs" tone="violet" title={providerLabel(result.provider)}>
              {result.model}
            </Badge>
          )}
          {returned < requested && (
            <Badge size="xs" tone="neutral" title="The AI returns fewer when the material is thin">
              {returned} of {requested} requested
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="xs"
          disabled={!!saving}
          onClick={() => setDrafts((prev) => prev.map((d) => ({ ...d, selected: !allSelected })))}
        >
          {allSelected ? "Deselect all" : "Select all"}
        </Button>
      </div>

      {saving && <ProgressBar value={(saving.done / saving.total) * 100} />}

      <ul className="flex flex-col gap-2.5">
        {drafts.map((d, i) => (
          <li key={d.key}>
            <AiDraftCard
              draft={d}
              index={i}
              disabled={!!saving}
              onChange={(next) => setDrafts((prev) => prev.map((x) => (x.key === d.key ? next : x)))}
              onRemove={() => setDrafts((prev) => prev.filter((x) => x.key !== d.key))}
            />
          </li>
        ))}
      </ul>

      {invalidKept > 0 && (
        <p className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" />
          Fix or untick {invalidKept} selected question{invalidKept === 1 ? "" : "s"} before adding.
        </p>
      )}
    </div>
  );
}

function AddedPhase({ result, created, where }: { result: AiGenerateResult; created: QuizQuestion[]; where: string }) {
  const questions = useMemo(() => byOrder(created), [created]);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-900 dark:text-white">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </span>{" "}
        {questions.length === 1 ? "is" : "are"} now at the end of the {where}. Edit them like any other question, or undo the whole batch.
      </p>
      <SourceInfo result={result} />
      <ol className="flex flex-col gap-2">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-ink-line dark:bg-ink-surface">
            <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
              <span className="mr-1.5 text-slate-400">{i + 1}.</span>
              {q.text}
            </p>
            <ul className="mt-1.5 flex flex-col gap-1">
              {byOrder(q.options).map((o) => (
                <li
                  key={o.id}
                  className={cn(
                    "flex items-start gap-2 text-[13px] leading-5",
                    o.is_correct ? "font-medium text-brand-800 dark:text-brand-200" : "text-slate-600 dark:text-slate-300",
                  )}
                >
                  <CorrectMark correct={o.is_correct} multiple={!!q.allow_multiple_answers} />
                  <span className="min-w-0 break-words">{o.text}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
