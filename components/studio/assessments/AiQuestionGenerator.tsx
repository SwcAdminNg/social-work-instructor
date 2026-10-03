"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, FileUp, Lightbulb, RefreshCw, Sparkles, X } from "lucide-react";
import { Badge, Button, Callout, Field, Input, Segmented, Select, Textarea, cn } from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/overlays";
import { useCourseEditor } from "@/components/studio/editor/CourseEditorContext";
import { studioApi } from "@/lib/studio/api";
import { formatBytes } from "@/lib/studio/labels";
import type { AiGeneratePayload, AiGenerateResult, AiProvider, GeneratedQuestion, QuizQuestion } from "@/lib/studio/types";
import { createQuestionFor, type QuestionTarget } from "./questionTarget";
import { CorrectMark, byOrder, nextOrderIndex, toQuestionPayload } from "./shared";
import { useAssessmentWrite } from "./useAssessmentWrite";

type Mode = "topic" | "document";
type Phase = "form" | "generating" | "review";

const PROVIDERS: { value: AiProvider | ""; label: string }[] = [
  { value: "", label: "Automatic (recommended)" },
  { value: "GEMINI", label: "Google Gemini" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "DEEPSEEK", label: "DeepSeek" },
];

const LOADING_LINES = [
  "Reading your material…",
  "Picking out the key ideas…",
  "Drafting questions…",
  "Writing plausible distractors…",
  "Checking the answers…",
  "Almost there — polishing wording…",
];

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** A generated question normalised so several correct options imply "several answers". */
function normalise(q: GeneratedQuestion): GeneratedQuestion {
  const correct = (q.options ?? []).filter((o) => o.is_correct).length;
  return { ...q, allow_multiple_answers: !!q.allow_multiple_answers || correct > 1 };
}

export function AiQuestionGenerator({
  open,
  onOpenChange,
  target,
  existing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: QuestionTarget;
  existing: QuizQuestion[];
}) {
  const { run } = useCourseEditor();
  const write = useAssessmentWrite();

  const [mode, setMode] = useState<Mode>("topic");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(10);
  const [perQuestion, setPerQuestion] = useState(4);
  const [provider, setProvider] = useState<AiProvider | "">("");
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<AiGenerateResult | null>(null);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const busy = phase === "generating" || adding;
  const generated = (result?.generated_questions ?? []).map(normalise);
  const chosen = generated.filter((_, i) => selected[i]);
  const canGenerate = mode === "topic" ? prompt.trim().length >= 3 : !!file;

  function reset() {
    setPhase("form");
    setResult(null);
    setSelected([]);
  }

  function close(next: boolean) {
    if (busy) return;
    onOpenChange(next);
    if (!next) reset();
  }

  async function generate() {
    if (!canGenerate) return;
    setPhase("generating");
    const payload: AiGeneratePayload = {
      prompt: prompt.trim() || undefined,
      question_count: Math.min(50, Math.max(1, count || 10)),
      options_per_question: Math.min(6, Math.max(2, perQuestion || 4)),
      persist: false,
      provider: provider || undefined,
    };
    const res = await run(
      () => {
        if (mode === "document" && file) {
          return target.kind === "quiz"
            ? studioApi.aiAutocomplete(target.itemId, { ...payload, file })
            : studioApi.groupAiAutocomplete(target.sectionId, { ...payload, file });
        }
        return target.kind === "quiz" ? studioApi.aiGenerate(target.itemId, payload) : studioApi.groupAiGenerate(target.sectionId, payload);
      },
      { refresh: false },
    );
    if (!res) {
      setPhase("form");
      return;
    }
    setResult(res);
    setSelected((res.generated_questions ?? []).map(() => true));
    setPhase("review");
  }

  async function addSelected() {
    if (!chosen.length) return;
    setAdding(true);
    const start = nextOrderIndex(existing);
    const ok = await write(
      async () => {
        for (let i = 0; i < chosen.length; i++) await createQuestionFor(target, toQuestionPayload(chosen[i], start + i));
      },
      { success: `Added ${chosen.length} question${chosen.length === 1 ? "" : "s"}` },
    );
    setAdding(false);
    if (ok) {
      onOpenChange(false);
      reset();
    }
  }

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    const ok = /\.(pdf|docx)$/i.test(f.name);
    if (!ok) return;
    setFile(f);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      dismissible={!busy}
      size="lg"
      icon={Sparkles}
      iconTone="violet"
      title={phase === "review" ? "Review generated questions" : "Generate questions with AI"}
      description={
        phase === "review"
          ? "Nothing is saved yet. Untick anything you don't want, then add the rest — you can edit them afterwards."
          : "Draft questions from a topic or your own course material. You'll review every question before it's added."
      }
      footer={
        phase === "review" ? (
          <>
            <Button variant="outline" icon={ArrowLeft} onClick={reset} disabled={adding}>
              Start over
            </Button>
            <Button icon={Sparkles} loading={adding} disabled={!chosen.length} onClick={addSelected}>
              Add {chosen.length} selected
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => close(false)} disabled={busy}>
              Cancel
            </Button>
            <Button icon={Sparkles} loading={phase === "generating"} disabled={!canGenerate} onClick={generate}>
              {phase === "generating" ? "Generating…" : `Generate ${count || 10} question${count === 1 ? "" : "s"}`}
            </Button>
          </>
        )
      }
    >
      {phase === "generating" && <GeneratingState mode={mode} />}

      {phase === "form" && (
        <div className="flex flex-col gap-5">
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            className="self-start"
            options={[
              { key: "topic", label: "From a topic", icon: Lightbulb },
              { key: "document", label: "From a document", icon: FileText },
            ]}
          />

          {mode === "document" && (
            <div>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                className="sr-only"
                aria-label="Choose a PDF or Word document"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-ink-line dark:bg-ink-surface">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300">
                    <FileText className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</p>
                  </div>
                  <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Remove document" onClick={() => setFile(null)} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
                    dragging
                      ? "border-violet-400 bg-violet-50/60 dark:bg-violet-500/10"
                      : "border-slate-300 hover:border-violet-300 hover:bg-violet-50/30 dark:border-ink-line dark:hover:border-violet-400/40 dark:hover:bg-violet-500/5",
                  )}
                >
                  <FileUp className="h-7 w-7 text-violet-500" strokeWidth={1.8} />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Drop a PDF or Word document here</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">or click to browse · .pdf, .docx</span>
                </button>
              )}
            </div>
          )}

          <Field
            label={mode === "topic" ? "What should the questions cover?" : "Anything to focus on?"}
            optional={mode === "document"}
            htmlFor="ai-prompt"
            hint={
              mode === "topic"
                ? "Be specific about level and context — e.g. “Section 47 enquiries for newly qualified social workers in Nigeria”."
                : "Optional — steer the questions towards a chapter, theme or level."
            }
          >
            <Textarea id="ai-prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Questions" htmlFor="ai-count" hint="1–50">
              <Input
                id="ai-count"
                type="number"
                min={1}
                max={50}
                value={count || ""}
                onChange={(e) => setCount(Math.min(50, Math.max(0, Number(e.target.value))))}
              />
            </Field>
            <Field label="Options each" htmlFor="ai-options">
              <Select id="ai-options" value={perQuestion} onChange={(e) => setPerQuestion(Number(e.target.value))}>
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} options
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="AI model" htmlFor="ai-provider">
              <Select id="ai-provider" value={provider} onChange={(e) => setProvider(e.target.value as AiProvider | "")}>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            AI can make mistakes. Check every question and answer against your source before learners see it.
          </p>
        </div>
      )}

      {phase === "review" && (
        <div className="flex flex-col gap-4">
          {result?.extracted_text_preview && (
            <details className="group rounded-xl border border-slate-200 bg-slate-50/70 dark:border-ink-line dark:bg-white/[0.02]">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <FileText className="h-4 w-4 text-violet-500" />
                What the AI read{result.source_file_name ? ` from ${result.source_file_name}` : ""}
                <span className="ml-auto text-xs font-normal text-slate-400 group-open:hidden">Show</span>
              </summary>
              <p className="max-h-48 overflow-y-auto whitespace-pre-wrap border-t border-slate-200 px-4 py-3 text-xs leading-5 text-slate-600 dark:border-ink-line dark:text-slate-300">
                {result.extracted_text_preview}
              </p>
            </details>
          )}

          {generated.length === 0 ? (
            <Callout
              tone="warning"
              title="No questions came back"
              actions={
                <Button size="sm" variant="outline" icon={RefreshCw} onClick={reset}>
                  Try again
                </Button>
              }
            >
              Try a more specific topic, a different model, or a document with more text.
            </Callout>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">{chosen.length}</span> of {generated.length} selected
                  {result?.provider && (
                    <Badge size="xs" tone="violet" className="ml-2">
                      {result.model ?? result.provider}
                    </Badge>
                  )}
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="xs" onClick={() => setSelected(generated.map(() => true))}>
                    Select all
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => setSelected(generated.map(() => false))}>
                    Clear
                  </Button>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5">
                {generated.map((q, i) => (
                  <li key={i}>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border p-3.5 transition",
                        selected[i]
                          ? "border-brand-300 bg-white ring-2 ring-brand-400/10 dark:border-brand-500/40 dark:bg-ink-surface"
                          : "border-slate-200 bg-slate-50/60 opacity-70 dark:border-ink-line dark:bg-white/[0.02]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected[i]}
                        onChange={(e) => setSelected((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))}
                        className="mt-1 h-4 w-4 flex-shrink-0 accent-brand-600 dark:accent-brand-400"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-6 text-slate-900 dark:text-white">
                          <span className="mr-1.5 text-slate-400">{i + 1}.</span>
                          {q.text}
                        </p>
                        {q.allow_multiple_answers && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">Several correct answers</p>
                        )}
                        <ul className="mt-2 flex flex-col gap-1">
                          {byOrder(q.options).map((o, j) => (
                            <li
                              key={j}
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
                        {!(q.options ?? []).some((o) => o.is_correct) && (
                          <Badge size="xs" tone="warning" className="mt-2">
                            No correct answer marked — fix it after adding
                          </Badge>
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}

function GeneratingState({ mode }: { mode: Mode }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((n) => Math.min(n + 1, LOADING_LINES.length - 1)), 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center" aria-live="polite">
      <div className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-violet-400/20" />
        <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-brand-500 text-white shadow-lg">
          <Sparkles className="h-7 w-7 animate-pulse" strokeWidth={1.8} />
        </span>
      </div>
      <div>
        <p className="font-display text-base font-bold text-slate-900 dark:text-white">
          {mode === "document" && line === 0 ? "Reading your document…" : LOADING_LINES[line]}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">This can take up to a minute. Please keep this window open.</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-2">
        {[0.9, 0.7, 0.8].map((w, i) => (
          <div
            key={i}
            className="h-2.5 animate-shimmer rounded-full bg-[linear-gradient(90deg,rgba(139,92,246,0.10)_0%,rgba(139,92,246,0.25)_50%,rgba(139,92,246,0.10)_100%)] bg-[length:800px_100%]"
            style={{ width: `${w * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}
