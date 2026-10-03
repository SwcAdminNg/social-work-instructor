"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Layers,
  Link2,
  PlayCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Callout, EmptyState, Skeleton, cn } from "@/components/ui/primitives";
import { ASSESSMENT_TYPE_LABELS, ITEM_TYPE_LABELS, formatBytes, formatDateTime, formatMinutes, humanize } from "@/lib/studio/labels";
import type { Item, ItemType, QuizQuestion, Section } from "@/lib/studio/types";

const ICONS: Record<ItemType, LucideIcon> = {
  VIDEO: PlayCircle,
  DOCUMENT: FileText,
  LINKS: Link2,
  LIVE_SESSION: CalendarDays,
  ASSESSMENT: ClipboardCheck,
};

/**
 * The working copy in editor format (GET …/tree), with correct answers
 * highlighted — for assessment moderators and QA.
 */
export function AnswersTree({
  sections,
  loading,
  error,
  onRetry,
}: {
  sections?: Section[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  const [assessmentsOnly, setAssessmentsOnly] = useState(false);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <Callout
        tone="danger"
        title="The content tree didn't load"
        actions={
          onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {error}
      </Callout>
    );
  }
  const modules = [...(sections ?? [])].sort((a, b) => a.order_index - b.order_index);
  if (!modules.length) return <EmptyState icon={Layers} title="No content yet" description="This revision has no modules." />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Correct answers are marked <span className="font-semibold text-emerald-700 dark:text-emerald-300">green</span>. Learners never see this view.
        </p>
        <Button size="sm" variant={assessmentsOnly ? "secondary" : "outline"} icon={ClipboardCheck} onClick={() => setAssessmentsOnly((v) => !v)}>
          {assessmentsOnly ? "Showing assessments only" : "Assessments only"}
        </Button>
      </div>
      {modules.map((m, mi) => {
        const items = [...(m.items ?? [])]
          .sort((a, b) => a.order_index - b.order_index)
          .filter((i) => !assessmentsOnly || i.item_type === "ASSESSMENT");
        if (assessmentsOnly && !items.length) return null;
        return (
          <section key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-ink-line dark:bg-ink-surface">
            <header className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5 dark:border-ink-line dark:bg-white/[0.02]">
              <p className="font-semibold text-slate-900 dark:text-white">
                <span className="text-slate-400">Module {mi + 1} · </span>
                {m.title}
              </p>
            </header>
            {items.length === 0 ? (
              <p className="px-5 py-4 text-sm text-slate-500">Empty module.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-ink-line">
                {items.map((item) => (
                  <ItemNode key={item.id} item={item} defaultOpen={item.item_type === "ASSESSMENT"} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function ItemNode({ item, defaultOpen }: { item: Item; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = ICONS[item.item_type] ?? FileText;
  const a = item.assessment;
  const typeLabel = a ? ASSESSMENT_TYPE_LABELS[a.assessment_type] : ITEM_TYPE_LABELS[item.item_type];
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60 sm:px-5 dark:hover:bg-white/[0.02]"
      >
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {typeLabel}
            {item.estimated_minutes ? ` · ${formatMinutes(item.estimated_minutes)}` : ""}
          </p>
        </div>
        <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
          {item.is_preview && <Badge size="xs" tone="warning">Free preview</Badge>}
          {a?.is_final_assessment && <Badge size="xs" tone="violet">Final assessment</Badge>}
        </div>
        <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 sm:px-5 sm:pl-[60px]">{<ItemDetail item={item} />}</div>}
    </li>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/[0.03]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function ItemDetail({ item }: { item: Item }) {
  const a = item.assessment;
  switch (item.item_type) {
    case "VIDEO":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <Fact label="Video" value={humanize(item.video?.status) || "Not uploaded"} />
          {item.video?.duration_seconds ? <Fact label="Length" value={formatMinutes(Math.round(item.video.duration_seconds / 60)) || "<1 min"} /> : null}
        </div>
      );
    case "DOCUMENT":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <Fact label="File" value={item.document?.file_name || "—"} />
          <Fact label="Upload" value={item.document?.is_uploaded ? `Complete${item.document.file_size_bytes ? ` · ${formatBytes(item.document.file_size_bytes)}` : ""}` : "Incomplete"} />
          <Fact label="Downloadable" value={item.document?.downloadable ? "Yes" : "No"} />
        </div>
      );
    case "LINKS":
      return item.link?.url ? (
        <a href={item.link.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{item.link.url}</span>
        </a>
      ) : (
        <p className="text-sm text-slate-500">No URL.</p>
      );
    case "LIVE_SESSION":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <Fact label="Starts" value={formatDateTime(item.live_session?.scheduled_start_at) || "—"} />
          <Fact label="Duration" value={formatMinutes(item.live_session?.duration_minutes) || "—"} />
          {item.live_session?.guest_name && <Fact label="Guest" value={item.live_session.guest_name} />}
        </div>
      );
    case "ASSESSMENT":
      if (!a) return null;
      if (a.assessment_type === "ESSAY") {
        return (
          <div className="flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-4">
              <Fact label="Pass mark" value={`${a.essay?.pass_mark_percentage ?? "—"}%`} />
              <Fact label="Attempts" value={a.essay?.max_attempts ?? "Unlimited"} />
              <Fact label="Submission" value={humanize(a.essay?.submission_mode) || "—"} />
              <Fact label="Moderated" value={a.essay?.requires_moderation ? "Yes" : "No"} />
            </div>
            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-ink-line">
              <p className="whitespace-pre-wrap text-sm font-semibold text-slate-900 dark:text-white">{a.essay?.question || "No question"}</p>
              {a.essay?.description && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{a.essay.description}</p>}
            </div>
          </div>
        );
      }
      if (a.assessment_type === "QUIZ") {
        return (
          <div className="flex flex-col gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Fact label="Pass mark" value={`${a.quiz?.pass_mark_percentage ?? "—"}%`} />
              <Fact label="Attempts" value={a.quiz?.max_attempts ?? "Unlimited"} />
              <Fact label="Result shown" value={a.quiz?.show_result_to_student ? "Yes" : "No"} />
            </div>
            <QuestionList questions={a.quiz?.questions} />
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <Fact label="Pass mark" value={`${a.quiz_group?.pass_mark_percentage ?? "—"}%`} />
            <Fact label="Attempts" value={a.quiz_group?.max_attempts ?? "Unlimited"} />
            <Fact label="Time limit" value={a.quiz_group?.time_limit_seconds ? `${Math.round(a.quiz_group.time_limit_seconds / 60)} min` : "None"} />
          </div>
          {(a.quiz_group?.sections ?? []).map((g) => (
            <div key={g.id} className="rounded-xl border border-slate-200 p-3 dark:border-ink-line">
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                {g.title}{" "}
                <span className="font-normal text-slate-500">
                  · asks {g.questions_to_ask ?? g.questions?.length ?? 0} of {g.questions?.length ?? 0}
                </span>
              </p>
              <QuestionList questions={g.questions} />
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function QuestionList({ questions }: { questions?: QuizQuestion[] }) {
  const list = [...(questions ?? [])].sort((a, b) => a.order_index - b.order_index);
  if (!list.length) return <p className="text-sm text-rose-600 dark:text-rose-300">No questions yet.</p>;
  return (
    <ol className="flex flex-col gap-3">
      {list.map((q, i) => {
        const options = [...(q.options ?? [])].sort((a, b) => a.order_index - b.order_index);
        const noCorrect = !options.some((o) => o.is_correct);
        return (
          <li key={q.id}>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {i + 1}. {q.text}
              {q.allow_multiple_answers && (
                <Badge size="xs" className="ml-2 align-middle">
                  {q.multi_answer_mode === "OR" ? "Any correct answer" : "All correct answers"}
                </Badge>
              )}
            </p>
            {noCorrect && <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-300">No correct answer marked</p>}
            <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
              {options.map((o) => (
                <li
                  key={o.id}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-[13px]",
                    o.is_correct
                      ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                      : "border-slate-200 text-slate-600 dark:border-ink-line dark:text-slate-300",
                  )}
                >
                  {o.is_correct ? <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.6} /> : <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-40" />}
                  <span className="min-w-0 break-words">{o.text}</span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
