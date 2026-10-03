"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Flag,
  Inbox,
  Megaphone,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Segmented,
  Skeleton,
  Textarea,
  cn,
} from "@/components/ui/primitives";
import { ConfirmDialog, Sheet } from "@/components/ui/overlays";
import { useAccess } from "@/components/studio/AccessContext";
import { ApiError, studioApi } from "@/lib/studio/api";
import { formatDateTime, relativeTime } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { EssayMark, EssaySettings, EssaySubmission } from "@/lib/studio/types";
import { itemMarksKey, useSyncMark } from "./markCache";
import { MarkStatusBadge, markStatus } from "./shared";

export type EssayContext = {
  itemTitle?: string;
  courseTitle?: string;
  sectionTitle?: string;
  isFinal?: boolean;
  essay?: EssaySettings;
};

type Bucket = "all" | "todo" | "progress" | "done";

const IN_PROGRESS = ["AWAITING_MODERATION", "MODERATED", "APPROVED", "DISPUTED", "UNDER_APPEAL"];
const EDITABLE = ["DRAFT_MARK", "RETURNED_TO_MARKER"];

function bucketOf(s: EssaySubmission): Exclude<Bucket, "all"> {
  const st = s.result_status;
  if (st && IN_PROGRESS.includes(st)) return "progress";
  if (st === "PUBLISHED" || st === "SUPERSEDED" || (!st && s.is_published)) return "done";
  return "todo";
}

function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
}

export function EssayMarking({
  itemId,
  courseId,
  context,
  initialSubmissions,
  initialLearner,
}: {
  itemId: string;
  courseId?: string;
  context?: EssayContext | null;
  initialSubmissions?: EssaySubmission[];
  initialLearner?: string;
}) {
  const { governanceEnabled, capabilities } = useAccess();
  const isDesktop = useIsDesktop();
  const [bucket, setBucket] = useState<Bucket>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialLearner ?? null);

  const subs = useQuery({
    queryKey: qk.essaySubmissions(itemId),
    queryFn: () => studioApi.listEssaySubmissions(itemId).then((r) => r.items),
    initialData: initialSubmissions,
    staleTime: 15_000,
  });

  const marks = useQuery({
    queryKey: itemMarksKey(itemId),
    queryFn: () => studioApi.listItemMarks(itemId),
    retry: false,
    staleTime: 15_000,
  });

  const submissions = useMemo(() => subs.data ?? [], [subs.data]);
  const counts = useMemo(() => {
    const c = { all: submissions.length, todo: 0, progress: 0, done: 0 };
    submissions.forEach((s) => c[bucketOf(s)]++);
    return c;
  }, [submissions]);
  const visible = bucket === "all" ? submissions : submissions.filter((s) => bucketOf(s) === bucket);
  const selected = submissions.find((s) => s.user_id === selectedId) ?? null;

  // Moderation only applies while content governance is on (moderation doc §1).
  const requiresModeration =
    governanceEnabled &&
    (context?.essay?.requires_moderation ??
      submissions.some((s) => s.result_status && s.result_status !== "PUBLISHED" && s.result_status !== "SUPERSEDED"));
  const passMark = context?.essay?.pass_mark_percentage ?? null;

  const approvedReady = (marks.data ?? []).filter((m) => m.status === "APPROVED" && m.available_actions?.includes("PUBLISH"));

  const title = context?.itemTitle ?? "Essay submissions";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
          eyebrow="Essay marking"
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
              {passMark !== null && <Badge tone="brand">Pass mark {passMark}%</Badge>}
              <Badge tone={requiresModeration ? "info" : "neutral"} icon={ShieldCheck}>
                {requiresModeration ? "Moderated marking" : "One-step marking"}
              </Badge>
              {courseId && (
                <ButtonLink href={`/dashboard/courses/${courseId}?tab=curriculum&item=${itemId}`} variant="outline" size="sm">
                  Edit essay
                </ButtonLink>
              )}
            </div>
          }
        />
      </div>

      {context?.essay?.question && (
        <Card className="bg-gradient-to-br from-white to-brand-50/40 dark:from-ink-surface dark:to-brand-400/[0.04]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">The question</p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-7 text-slate-900 dark:text-white">{context.essay.question}</p>
          {context.essay.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">{context.essay.description}</p>
          )}
        </Card>
      )}

      {approvedReady.length > 0 && (
        <PublishApproved itemId={itemId} count={approvedReady.length} />
      )}

      {subs.isError && !subs.data ? (
        <Callout
          tone="danger"
          icon={AlertTriangle}
          title="We couldn't load submissions"
          actions={
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => subs.refetch()} loading={subs.isFetching}>
              Try again
            </Button>
          }
        >
          {(subs.error as Error)?.message}
        </Callout>
      ) : subs.isPending ? (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Card padded={false} className="p-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </Card>
          <Card className="hidden lg:block">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-4 h-40 w-full" />
          </Card>
        </div>
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No submissions yet"
          description="When learners submit this essay, they'll appear here ready for marking."
          action={
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => subs.refetch()} loading={subs.isFetching}>
              Check again
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
          <Card padded={false} className="overflow-hidden lg:sticky lg:top-4">
            <div className="border-b border-slate-100 p-3 dark:border-ink-line">
              <Segmented<Bucket>
                size="sm"
                value={bucket}
                onChange={setBucket}
                className="w-full [&>button]:flex-1"
                options={[
                  { key: "all", label: `All ${counts.all}` },
                  { key: "todo", label: `To mark ${counts.todo}` },
                  { key: "progress", label: `In review ${counts.progress}` },
                  { key: "done", label: `Done ${counts.done}` },
                ]}
              />
            </div>
            {visible.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">Nothing here right now.</p>
            ) : (
              <ul className="max-h-[70vh] overflow-y-auto p-1.5" aria-label="Submissions">
                {visible.map((s) => {
                  const active = s.user_id === selectedId;
                  const score = s.working_score ?? s.score;
                  return (
                    <li key={s.user_id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(s.user_id)}
                        aria-current={active}
                        className={cn(
                          "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition",
                          active
                            ? "bg-brand-50 ring-1 ring-inset ring-brand-200 dark:bg-brand-400/10 dark:ring-brand-400/25"
                            : "hover:bg-slate-50 dark:hover:bg-white/[0.03]",
                        )}
                      >
                        <Avatar name={s.user_full_name ?? s.user_email} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {s.user_full_name ?? s.user_email ?? "Learner"}
                          </span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                            {s.submitted_at ? `Submitted ${relativeTime(s.submitted_at)}` : s.user_email}
                          </span>
                        </span>
                        <span className="flex flex-col items-end gap-1">
                          <MarkStatusBadge status={s.result_status} published={s.is_published} />
                          {score !== null && score !== undefined && (
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{score}%</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {isDesktop ? (
            selected ? (
              <MarkingPane
                key={selected.user_id}
                itemId={itemId}
                submission={selected}
                requiresModeration={requiresModeration}
                passMark={passMark}
                canMark={!!capabilities.can_mark_essays}
              />
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="Pick a submission to mark"
                description="Choose a learner on the left to read their essay and record a score and feedback."
                className="min-h-[24rem]"
              />
            )
          ) : (
            <Sheet
              open={!!selected}
              onOpenChange={(v) => !v && setSelectedId(null)}
              title={selected?.user_full_name ?? "Submission"}
              description={selected?.user_email}
            >
              {selected && (
                <MarkingPane
                  key={selected.user_id}
                  itemId={itemId}
                  submission={selected}
                  requiresModeration={requiresModeration}
                  passMark={passMark}
                  canMark={!!capabilities.can_mark_essays}
                  bare
                />
              )}
            </Sheet>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Publish approved ───────────────────────── */

function PublishApproved({ itemId, count }: { itemId: string; count: number }) {
  const sync = useSyncMark();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Callout
        tone="success"
        icon={Megaphone}
        title={`${count} approved result${count === 1 ? " is" : "s are"} ready to release`}
        actions={
          <Button size="sm" icon={Megaphone} onClick={() => setOpen(true)}>
            Publish {count === 1 ? "result" : "all approved"}
          </Button>
        }
      >
        Learners only see their mark once it&apos;s published.
      </Callout>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        tone="brand"
        title={`Publish ${count} approved result${count === 1 ? "" : "s"}?`}
        description="Learners will see their final score and feedback. For a module gate, a pass unlocks the next module and running out of attempts resets it."
        confirmLabel="Publish results"
        onConfirm={async () => {
          try {
            const res = await studioApi.publishMarks(itemId, { all_approved: true });
            toast.success("Results published");
            await sync(res, itemId);
          } catch (e) {
            toast.error((e as Error).message);
            throw e;
          }
        }}
      />
    </>
  );
}

/* ───────────────────────── Marking pane ───────────────────────── */

function MarkingPane({
  itemId,
  submission: s,
  requiresModeration,
  passMark,
  canMark,
  bare,
}: {
  itemId: string;
  submission: EssaySubmission;
  requiresModeration: boolean;
  passMark: number | null;
  canMark: boolean;
  bare?: boolean;
}) {
  const markQuery = useQuery({
    queryKey: qk.mark(s.current_mark_id ?? "none"),
    queryFn: () => studioApi.getMark(s.current_mark_id as string),
    enabled: !!s.current_mark_id,
    retry: false,
  });
  const mark = s.current_mark_id ? markQuery.data : undefined;
  const status = mark?.status ?? s.result_status ?? null;
  const words = s.content_text ? s.content_text.trim().split(/\s+/).filter(Boolean).length : 0;

  const editable =
    canMark &&
    (!requiresModeration || !status || EDITABLE.includes(status) || !!mark?.available_actions?.includes("EDIT"));

  const body = (
    <div className="flex flex-col gap-5">
      {/* Learner */}
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={s.user_full_name ?? s.user_email} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-slate-900 dark:text-white">{s.user_full_name ?? "Learner"}</p>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {s.user_email}
            {s.submitted_at && <> · submitted {formatDateTime(s.submitted_at)}</>}
          </p>
        </div>
        <MarkStatusBadge status={status} published={s.is_published} size="sm" />
      </div>

      {/* The essay */}
      {s.content_text ? (
        <div className="rounded-xl border border-slate-200/80 bg-[#fffdf8] dark:border-ink-line dark:bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-2.5 text-xs text-slate-500 dark:border-ink-line dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Submission</span>
            <span>{words.toLocaleString()} words</span>
          </div>
          <article className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap px-5 py-4 font-serif text-[15.5px] leading-[1.8] text-slate-800 dark:text-slate-200">
            {s.content_text}
          </article>
        </div>
      ) : s.document_download_url || s.document_file_name ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-ink-line dark:bg-ink-surface">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/12 dark:text-sky-300">
            <FileText className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.document_file_name ?? "Submitted document"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Download and read it, then record your mark below.</p>
          </div>
          {s.document_download_url && (
            <a
              href={s.document_download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-50 px-3 text-[13px] font-semibold text-brand-700 no-underline hover:bg-brand-100 dark:bg-brand-400/12 dark:text-brand-300"
            >
              <Download className="h-4 w-4" />
              Open
            </a>
          )}
        </div>
      ) : (
        <Callout tone="neutral" icon={FileText}>
          The submission has no text or document attached.
        </Callout>
      )}

      {/* Returned / moderation context */}
      {status === "RETURNED_TO_MARKER" && mark?.moderation_note && (
        <Callout tone="warning" icon={Undo2} title="Returned by the moderator">
          {mark.moderation_note}
        </Callout>
      )}

      {s.current_mark_id && markQuery.isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : editable ? (
        <MarkForm
          itemId={itemId}
          submission={s}
          mark={mark}
          requiresModeration={requiresModeration}
          passMark={passMark}
        />
      ) : (
        <MarkSummary submission={s} mark={mark} status={status} canMark={canMark} />
      )}
    </div>
  );

  return bare ? body : <Card>{body}</Card>;
}

function MarkSummary({
  submission: s,
  mark,
  status,
  canMark,
}: {
  submission: EssaySubmission;
  mark?: EssayMark;
  status: string | null;
  canMark: boolean;
}) {
  const score = mark?.final_score ?? mark?.moderated_score ?? mark?.score ?? s.working_score ?? s.score;
  const feedback = mark?.final_feedback ?? mark?.moderated_feedback ?? mark?.feedback ?? s.feedback;
  const st = markStatus(status ?? (s.is_published ? "PUBLISHED" : null));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Score</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {score !== null && score !== undefined ? `${score}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900 dark:text-white">{st.label}</p>
          {st.description && <p className="text-xs text-slate-500 dark:text-slate-400">{st.description}</p>}
        </div>
      </div>
      {feedback && (
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Feedback</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{feedback}</p>
        </div>
      )}
      {!canMark && (
        <Callout tone="neutral">You can read submissions, but marking needs the marker role on this course.</Callout>
      )}
      {s.current_mark_id && (
        <ButtonLink href={`/dashboard/approval-centre/marks/${s.current_mark_id}`} variant="outline" size="sm" iconRight={ExternalLink} className="self-start">
          Open mark details
        </ButtonLink>
      )}
    </div>
  );
}

function MarkForm({
  itemId,
  submission: s,
  mark,
  requiresModeration,
  passMark,
}: {
  itemId: string;
  submission: EssaySubmission;
  mark?: EssayMark;
  requiresModeration: boolean;
  passMark: number | null;
}) {
  const sync = useSyncMark();
  const initialScore = mark?.score ?? s.working_score ?? s.score ?? null;
  const [score, setScore] = useState(initialScore !== null && initialScore !== undefined ? String(initialScore) : "");
  const [feedback, setFeedback] = useState(mark?.feedback ?? s.feedback ?? "");
  const [recommendation, setRecommendation] = useState<"PASS" | "FAIL" | null>(mark?.recommendation ?? null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const n = Number(score);
  const scoreValid = score.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100;
  const suggested: "PASS" | "FAIL" | null = scoreValid && passMark !== null ? (n >= passMark ? "PASS" : "FAIL") : null;
  const rec = recommendation ?? suggested;

  const grade = useMutation({
    mutationFn: (opts: { submit?: boolean; publish?: boolean }) =>
      studioApi.gradeEssay(itemId, s.user_id, {
        score: n,
        feedback: feedback.trim() || undefined,
        recommendation: rec ?? undefined,
        ...(requiresModeration ? { submit_for_moderation: !!opts.submit } : { is_published: !!opts.publish }),
      }),
    onSuccess: async (res, opts) => {
      toast.success(
        requiresModeration
          ? opts.submit
            ? "Sent to moderation"
            : "Draft mark saved"
          : opts.publish
            ? "Result published to the learner"
            : "Mark saved (not yet visible to the learner)",
      );
      await sync(res, itemId);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : (e as Error).message),
  });

  const pending = grade.isPending ? grade.variables : null;

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 dark:border-ink-line">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Field label="Score" htmlFor="essay-score" error={score && !scoreValid ? "Enter a score from 0 to 100." : undefined} className="sm:w-40">
          <div className="relative">
            <Input
              id="essay-score"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="pr-8 text-lg font-bold"
              invalid={!!score && !scoreValid}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">%</span>
          </div>
        </Field>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">Against the pass mark</p>
          <div className="relative mt-3 h-2.5 rounded-full bg-slate-100 dark:bg-white/8">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300",
                !scoreValid ? "bg-slate-300" : suggested === "FAIL" ? "bg-rose-400" : "bg-brand-500",
              )}
              style={{ width: `${scoreValid ? n : 0}%` }}
            />
            {passMark !== null && (
              <span
                className="absolute -top-1 h-[18px] w-0.5 rounded bg-slate-700 dark:bg-slate-200"
                style={{ left: `${passMark}%` }}
                title={`Pass mark ${passMark}%`}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {passMark !== null ? `Pass mark is ${passMark}%.` : "Pass mark not available."}{" "}
            {suggested && <span className="font-semibold">{suggested === "PASS" ? "This would be a pass." : "This would not pass."}</span>}
          </p>
        </div>
      </div>

      <Field label="Recommendation" hint={recommendation === null && suggested ? "Suggested from the score — choose to override." : undefined}>
        <Segmented<"PASS" | "FAIL">
          value={rec ?? ("" as "PASS")}
          onChange={setRecommendation}
          className="self-start"
          options={[
            { key: "PASS", label: "Pass", icon: CheckCircle2 },
            { key: "FAIL", label: "Not yet", icon: XCircle },
          ]}
        />
      </Field>

      <Field label="Feedback for the learner" htmlFor="essay-feedback" hint="Be specific: what worked, what to develop, and how.">
        <Textarea id="essay-feedback" rows={6} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        {s.current_mark_id ? (
          <Link
            href={`/dashboard/approval-centre/marks/${s.current_mark_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 no-underline hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            Mark history <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <span className="text-xs text-slate-400">
            {requiresModeration ? "A moderator checks the mark before learners see it." : "Learners see the result only once it's published."}
          </span>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          {requiresModeration ? (
            <>
              <Button
                variant="outline"
                icon={Save}
                disabled={!scoreValid || grade.isPending}
                loading={!!pending && !pending.submit}
                onClick={() => grade.mutate({ submit: false })}
              >
                Save draft
              </Button>
              <Button
                icon={Send}
                disabled={!scoreValid || grade.isPending}
                loading={!!pending?.submit}
                onClick={() => grade.mutate({ submit: true })}
              >
                Send to moderation
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                icon={Save}
                disabled={!scoreValid || grade.isPending}
                loading={!!pending && !pending.publish}
                onClick={() => grade.mutate({ publish: false })}
              >
                Save without releasing
              </Button>
              <Button
                icon={Megaphone}
                disabled={!scoreValid || grade.isPending}
                loading={!!pending?.publish}
                onClick={() => setConfirmPublish(true)}
              >
                Publish result
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        tone="brand"
        title="Publish this result?"
        description={`${s.user_full_name ?? "The learner"} will see a score of ${scoreValid ? n : "—"}% and your feedback. For a module gate, a pass unlocks the next module.`}
        confirmLabel="Publish result"
        onConfirm={() => grade.mutateAsync({ publish: true })}
      />
    </div>
  );
}
