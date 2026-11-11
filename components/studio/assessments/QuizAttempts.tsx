"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Flag,
  Inbox,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Segmented,
  StatCard,
  cn,
} from "@/components/ui/primitives";
import { studioApi } from "@/lib/studio/api";
import { formatDateTime } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { QuizAttemptReview, QuizAttemptReviewQuestion } from "@/lib/studio/types";

export type QuizAttemptsContext = {
  itemTitle?: string;
  courseTitle?: string;
  sectionTitle?: string;
  isFinal?: boolean;
  isGroup?: boolean;
  passMark?: number | null;
};

type Filter = "all" | "reworded" | "passed" | "failed";

/**
 * Every learner attempt at a quiz, each exactly as that learner saw it. Retries are
 * reworded by AI so they can't be passed from memory; this is where staff can see
 * the wording a learner got, what they chose and what was correct.
 */
export function QuizAttempts({
  itemId,
  courseId,
  context,
  initialAttempts,
}: {
  itemId: string;
  courseId?: string;
  context?: QuizAttemptsContext | null;
  initialAttempts?: QuizAttemptReview[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const attempts = useQuery({
    queryKey: qk.quizAttempts(itemId),
    queryFn: () => studioApi.listQuizAttempts(itemId).then((r) => r.items),
    initialData: initialAttempts,
    staleTime: 15_000,
  });

  const rows = useMemo(() => attempts.data ?? [], [attempts.data]);
  const stats = useMemo(() => {
    const submitted = rows.filter((a) => a.status === "SUBMITTED");
    return {
      attempts: rows.length,
      learners: new Set(rows.map((a) => a.user_id)).size,
      reworded: rows.filter((a) => a.paraphrased).length,
      passRate: submitted.length
        ? Math.round((submitted.filter((a) => a.passed).length / submitted.length) * 100)
        : null,
    };
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((a) => {
      if (filter === "reworded" && !a.paraphrased) return false;
      if (filter === "passed" && !(a.status === "SUBMITTED" && a.passed)) return false;
      if (filter === "failed" && !(a.status === "SUBMITTED" && !a.passed)) return false;
      if (!q) return true;
      return a.user_full_name.toLowerCase().includes(q) || a.user_email.toLowerCase().includes(q);
    });
  }, [rows, filter, query]);

  const title = context?.itemTitle ?? "Quiz attempts";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <Link
          href="/dashboard/assessments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 no-underline hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Assessments
        </Link>
        <PageHeader
          className="mt-3"
          eyebrow={context?.isGroup ? "Quiz group attempts" : "Quiz attempts"}
          title={title}
          description={
            context?.courseTitle ? (
              <span>
                {context.courseTitle}
                {context.sectionTitle ? ` › ${context.sectionTitle}` : ""}
              </span>
            ) : undefined
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {context?.isFinal && (
                <Badge tone="violet" icon={Flag}>
                  Module gate
                </Badge>
              )}
              {context?.passMark != null && <Badge tone="brand">Pass mark {context.passMark}%</Badge>}
              {courseId && (
                <ButtonLink href={`/dashboard/courses/${courseId}?tab=curriculum&item=${itemId}`} variant="outline" size="sm">
                  Edit quiz
                </ButtonLink>
              )}
            </div>
          }
        />
      </div>

      <Callout tone="info" icon={Sparkles} title="Retries are reworded by AI">
        When a learner takes this quiz again, every question and answer is reworded and the answers are reshuffled, so a
        retry can&apos;t be passed from memory. Each attempt below shows the wording that learner saw.
      </Callout>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Attempts" value={stats.attempts} icon={Inbox} />
        <StatCard label="Learners" value={stats.learners} icon={Users} />
        <StatCard label="Reworded retries" value={stats.reworded} icon={Sparkles} tone="violet" />
        <StatCard label="Pass rate" value={stats.passRate === null ? "—" : `${stats.passRate}%`} icon={Check} tone="success" />
      </div>

      {attempts.isError && !attempts.data ? (
        <Callout
          tone="danger"
          icon={AlertTriangle}
          title="We couldn't load attempts"
          actions={
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => attempts.refetch()} loading={attempts.isFetching}>
              Try again
            </Button>
          }
        >
          You need marking, moderation or results approval rights on this course to see learner attempts.
        </Callout>
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} title="No attempts yet" description="Learner attempts show here once someone takes this quiz." />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented<Filter>
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { key: "all", label: "All" },
                { key: "reworded", label: "Reworded" },
                { key: "passed", label: "Passed" },
                { key: "failed", label: "Not passed" },
              ]}
            />
            <div className="sm:w-72">
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search learners"
                aria-label="Search learners"
                leading={<Search className="h-4 w-4" />}
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState compact icon={Search} title="No attempts match" description="Try another filter or name." />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {visible.map((attempt) => (
                <AttemptCard key={attempt.attempt_id} attempt={attempt} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function AttemptCard({ attempt }: { attempt: QuizAttemptReview }) {
  const [open, setOpen] = useState(false);
  const inProgress = attempt.status === "IN_PROGRESS";
  const when = attempt.submitted_at ?? attempt.started_at;
  const correct = attempt.questions.filter((q) => q.earned >= 1).length;

  return (
    <li>
      <Card padded={false} className="overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left sm:px-5"
        >
          <Avatar name={attempt.user_full_name} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-900 dark:text-white">{attempt.user_full_name}</span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
              {attempt.user_email} · Attempt {attempt.attempt_number}
              {when ? ` · ${formatDateTime(when)}` : ""}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            {attempt.paraphrased && (
              <Badge size="xs" tone="violet" icon={Sparkles}>
                Reworded by AI
              </Badge>
            )}
            {attempt.is_reset && <Badge size="xs" tone="neutral">Cleared by reset</Badge>}
            {attempt.auto_submitted && <Badge size="xs" tone="warning">Time ran out</Badge>}
            {inProgress ? (
              <Badge size="xs" tone="info" dot pulse>
                In progress
              </Badge>
            ) : (
              <Badge size="xs" tone={attempt.passed ? "success" : "danger"}>
                {typeof attempt.score === "number" ? `${Math.round(attempt.score)}%` : "—"} · {attempt.passed ? "Passed" : "Not passed"}
              </Badge>
            )}
            <ChevronDown
              className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </span>
        </button>

        {open && (
          <div className="flex flex-col gap-3 border-t border-slate-200/80 bg-slate-50/60 px-4 py-4 sm:px-5 dark:border-white/10 dark:bg-white/[0.02]">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {correct} of {attempt.questions.length} questions fully correct
              {attempt.paraphrased && attempt.paraphrase_model ? ` · reworded with ${attempt.paraphrase_model}` : ""}
            </p>
            {!attempt.version_recorded && (
              <Callout tone="warning" icon={AlertTriangle}>
                This attempt was made before quiz versions were saved, so today&apos;s wording is shown.
              </Callout>
            )}
            {attempt.questions.map((question, idx) => (
              <QuestionReview key={question.id} index={idx} question={question} />
            ))}
          </div>
        )}
      </Card>
    </li>
  );
}

function QuestionReview({ index, question }: { index: number; question: QuizAttemptReviewQuestion }) {
  const reworded = question.text !== question.original_text;
  const answered = question.options.some((o) => o.selected);
  const verdict = !answered
    ? { label: "Not answered", tone: "neutral" as const }
    : question.earned >= 1
      ? { label: "Correct", tone: "success" as const }
      : question.earned > 0
        ? { label: "Partly correct", tone: "warning" as const }
        : { label: "Incorrect", tone: "danger" as const };

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 dark:bg-ink-surface dark:ring-white/10">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Question {index + 1}
          {question.section_title ? ` · ${question.section_title}` : ""}
          {question.allow_multiple_answers ? " · choose all that apply" : ""}
        </p>
        <Badge size="xs" tone={verdict.tone}>
          {verdict.label}
        </Badge>
      </div>
      <p className="mt-1.5 text-[15px] font-semibold leading-6 text-slate-900 dark:text-white">{question.text}</p>
      {reworded && (
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Original:</span> {question.original_text}
        </p>
      )}
      <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
        {question.options.map((option) => (
          <li
            key={option.id}
            className={cn(
              "rounded-lg px-3 py-2 ring-1",
              option.is_correct
                ? "bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-400/25"
                : option.selected
                  ? "bg-rose-50 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-400/25"
                  : "bg-slate-50 ring-slate-200/70 dark:bg-white/[0.03] dark:ring-white/10",
            )}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  "mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full",
                  option.is_correct ? "bg-emerald-500 text-white" : option.selected ? "bg-rose-500 text-white" : "ring-1 ring-slate-300 dark:ring-white/20",
                )}
                aria-hidden="true"
              >
                {option.is_correct ? <Check className="h-3 w-3" strokeWidth={3} /> : option.selected ? <X className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">{option.text}</span>
              <span className="flex flex-none gap-1.5 text-[11px] font-semibold">
                {option.selected && <span className="text-slate-700 dark:text-slate-200">Chosen</span>}
                {option.is_correct && <span className="text-emerald-700 dark:text-emerald-300">Correct</span>}
              </span>
            </div>
            {option.text !== option.original_text && (
              <p className="mt-0.5 pl-[26px] text-xs text-slate-500 dark:text-slate-400">Original: {option.original_text}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
