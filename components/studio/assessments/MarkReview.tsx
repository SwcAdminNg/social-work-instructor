"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Gavel,
  History,
  Megaphone,
  MessageSquareWarning,
  PenLine,
  RefreshCw,
  Scale,
  Send,
  Undo2,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Segmented,
  Skeleton,
  Switch,
  Textarea,
  cn,
} from "@/components/ui/primitives";
import { ConfirmDialog, Dialog } from "@/components/ui/overlays";
import { ApiError, studioApi } from "@/lib/studio/api";
import { formatDateTime, humanize, relativeTime } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { EssayMark } from "@/lib/studio/types";
import { useSyncMark } from "./markCache";
import { MarkStatusBadge, markStatus } from "./shared";

type Mark = EssayMark & { blocked_reason?: string | null };

const STEPS = [
  { status: "DRAFT_MARK", label: "Marked" },
  { status: "AWAITING_MODERATION", label: "Moderation" },
  { status: "MODERATED", label: "Moderated" },
  { status: "APPROVED", label: "Approved" },
  { status: "PUBLISHED", label: "Published" },
];

function stepIndex(status: string) {
  if (status === "RETURNED_TO_MARKER") return 0;
  if (status === "DISPUTED") return 2;
  if (status === "SUPERSEDED") return 4;
  const i = STEPS.findIndex((s) => s.status === status);
  return i < 0 ? 0 : i;
}

export function MarkReview({ markId, initialMark }: { markId: string; initialMark?: Mark | null }) {
  const query = useQuery({
    queryKey: qk.mark(markId),
    queryFn: () => studioApi.getMark(markId) as Promise<Mark>,
    initialData: initialMark ?? undefined,
    retry: (count, err) => !(err instanceof ApiError && (err.status === 404 || err.status === 403)) && count < 2,
  });

  const back = (
    <Link
      href="/dashboard/approval-centre"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 no-underline hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
    >
      <ArrowLeft className="h-4 w-4" />
      Approval Centre
    </Link>
  );

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {back}
        <MarkReviewSkeleton />
      </div>
    );
  }

  if (query.isError || !query.data) {
    const err = query.error;
    const missing = err instanceof ApiError && (err.status === 404 || err.status === 403);
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {back}
        <EmptyState
          icon={FileSearch}
          title={missing ? "We couldn't find this mark" : "This mark didn't load"}
          description={
            missing
              ? "It may have been replaced by a newer mark, or you may not have a marking role on this course any more."
              : (err as Error | null)?.message ?? "Please try again."
          }
          action={
            <>
              {!missing && (
                <Button variant="outline" icon={RefreshCw} loading={query.isFetching} onClick={() => query.refetch()}>
                  Try again
                </Button>
              )}
              <ButtonLink href="/dashboard/approval-centre">Back to the Approval Centre</ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {back}
      <MarkDetail mark={query.data} />
    </div>
  );
}

function MarkDetail({ mark }: { mark: Mark }) {
  const actions = new Set(mark.available_actions ?? []);
  const status = mark.status;
  const st = markStatus(status);
  const studentName = mark.student?.name ?? "Learner";

  return (
    <>
      {/* Header */}
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={studentName} size="lg" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">Essay mark</p>
              <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">{studentName}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {mark.item_title ?? "Essay"}
                {mark.course_title && <> · {mark.course_title}</>}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <MarkStatusBadge status={status} size="sm" />
                {mark.recommendation && (
                  <Badge tone={mark.recommendation === "PASS" ? "success" : "danger"} icon={mark.recommendation === "PASS" ? CheckCircle2 : AlertTriangle}>
                    Recommends {mark.recommendation === "PASS" ? "pass" : "not yet"}
                  </Badge>
                )}
                {mark.updated_at && <span className="text-xs text-slate-400">Updated {relativeTime(mark.updated_at)}</span>}
              </div>
            </div>
          </div>
          <ActionBar mark={mark} actions={actions} />
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        <Timeline status={status} />
        {status === "RETURNED_TO_MARKER" && (
          <Callout tone="warning" icon={Undo2} title="Returned to the marker" className="mt-5">
            {mark.moderation_note || "The moderator asked the marker to look again."}
          </Callout>
        )}
        {status === "SUPERSEDED" && (
          <Callout tone="neutral" icon={History} title="Superseded" className="mt-5">
            A later published mark replaced this one. It&apos;s kept for the record.
          </Callout>
        )}
        {mark.dispute_note && (
          <Callout tone="danger" icon={MessageSquareWarning} title="The marker disputed the moderation" className="mt-5">
            {mark.dispute_note}
          </Callout>
        )}
        {mark.moderation_note && status !== "RETURNED_TO_MARKER" && (
          <Callout tone="info" icon={Scale} title="Moderator's note" className="mt-5">
            {mark.moderation_note}
          </Callout>
        )}
        {actions.size === 0 && (
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            {mark.blocked_reason || `${st.description} There's nothing for you to do at this stage.`}
          </p>
        )}
      </Card>

      {/* Scores */}
      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard
          title="Marker"
          person={mark.marker?.name}
          score={mark.score}
          feedback={mark.feedback}
          active={mark.final_score == null && mark.moderated_score == null}
        />
        <ScoreCard
          title="Moderator"
          person={mark.moderator?.name}
          score={mark.moderated_score}
          feedback={mark.moderated_feedback}
          active={mark.final_score == null && mark.moderated_score != null}
          changed={mark.moderated_score != null && mark.score != null && mark.moderated_score !== mark.score}
        />
        <ScoreCard
          title="Final"
          person={mark.approver?.name}
          score={mark.final_score}
          feedback={mark.final_feedback}
          active={mark.final_score != null}
        />
      </div>

      <HistoryCard history={mark.history} />
    </>
  );
}

/* ───────────────────────── Timeline ───────────────────────── */

function Timeline({ status }: { status: string }) {
  const current = stepIndex(status);
  const finished = status === "PUBLISHED" || status === "SUPERSEDED";
  const problem = status === "RETURNED_TO_MARKER" || status === "DISPUTED";
  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0" aria-label="Mark progress">
      {STEPS.map((step, i) => {
        const done = i < current || (finished && i <= current);
        const isCurrent = i === current && !finished;
        return (
          <li key={step.status} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center">
            <div className="flex w-full items-center sm:justify-center">
              <span className={cn("hidden h-0.5 flex-1 sm:block", i === 0 ? "bg-transparent" : done || isCurrent ? "bg-brand-400" : "bg-slate-200 dark:bg-white/10")} />
              <span
                className={cn(
                  "grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-xs font-bold ring-4",
                  done
                    ? "bg-brand-600 text-white ring-brand-100 dark:bg-brand-400 dark:text-[#06130d] dark:ring-brand-400/15"
                    : isCurrent
                      ? problem
                        ? "bg-amber-500 text-white ring-amber-100 dark:ring-amber-500/20"
                        : "bg-white text-brand-700 ring-brand-200 dark:bg-ink-surface dark:text-brand-300 dark:ring-brand-400/30"
                      : "bg-slate-100 text-slate-400 ring-transparent dark:bg-white/8",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden h-0.5 flex-1 sm:block",
                  i === STEPS.length - 1 ? "bg-transparent" : done ? "bg-brand-400" : "bg-slate-200 dark:bg-white/10",
                )}
              />
            </div>
            <span
              className={cn(
                "text-sm font-semibold sm:text-xs",
                isCurrent ? "text-slate-900 dark:text-white" : done ? "text-slate-600 dark:text-slate-300" : "text-slate-400",
              )}
            >
              {isCurrent && problem ? markStatus(status).label : step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────────────────── Scores ───────────────────────── */

function ScoreCard({
  title,
  person,
  score,
  feedback,
  active,
  changed,
}: {
  title: string;
  person?: string;
  score?: number | null;
  feedback?: string | null;
  active?: boolean;
  changed?: boolean;
}) {
  const has = score !== null && score !== undefined;
  return (
    <Card className={cn(active && has && "border-brand-300 ring-4 ring-brand-400/10 dark:border-brand-500/40")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p>
        {active && has && (
          <Badge size="xs" tone="brand">
            Current
          </Badge>
        )}
        {changed && (
          <Badge size="xs" tone="violet">
            Amended
          </Badge>
        )}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{person ?? (has ? "—" : "Not yet")}</p>
      <p className={cn("mt-3 font-display text-3xl font-extrabold tracking-tight", has ? "text-slate-950 dark:text-white" : "text-slate-300 dark:text-slate-600")}>
        {has ? `${score}%` : "—"}
      </p>
      {feedback ? (
        <p className="mt-3 line-clamp-[8] whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{feedback}</p>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No feedback recorded.</p>
      )}
    </Card>
  );
}

/* ───────────────────────── History ───────────────────────── */

function pick(entry: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = entry[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function personName(v: unknown) {
  if (!v) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v && "name" in v) return String((v as { name?: unknown }).name ?? "");
  return undefined;
}

function HistoryCard({ history }: { history?: Record<string, unknown>[] }) {
  const entries = Array.isArray(history) ? history : [];
  return (
    <Card>
      <CardHeader icon={History} title="History" description="Every change to this mark, oldest first." />
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No history recorded yet.</p>
      ) : (
        <ol className="relative flex flex-col gap-5 border-l border-slate-200 pl-5 dark:border-ink-line">
          {entries.map((e, i) => {
            const action = pick(e, "action", "event", "type", "transition");
            const to = pick(e, "to_status", "status", "new_status");
            const from = pick(e, "from_status", "old_status");
            const actor = personName(pick(e, "actor", "by", "user", "performed_by", "actor_name"));
            const at = pick(e, "at", "created_at", "timestamp", "date");
            const note = pick(e, "note", "comment", "moderation_note", "dispute_note");
            const score = pick(e, "final_score", "moderated_score", "score");
            const feedback = pick(e, "final_feedback", "moderated_feedback", "feedback");
            const title = action ? humanize(String(action)) : to ? markStatus(String(to)).label : "Update";
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-ink-surface" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                  {from && to ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {markStatus(String(from)).label} → {markStatus(String(to)).label}
                    </span>
                  ) : (
                    to && action && <MarkStatusBadge status={String(to)} />
                  )}
                  {typeof score === "number" && (
                    <Badge size="xs" tone="neutral">
                      {score}%
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {[actor, at ? formatDateTime(String(at)) : null].filter(Boolean).join(" · ")}
                </p>
                {(note || feedback) && (
                  <p className="mt-1.5 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
                    {String(note ?? feedback)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

/* ───────────────────────── Actions ───────────────────────── */

type Open = null | "submit" | "moderate" | "dispute" | "approve" | "publish";

function ActionBar({ mark, actions }: { mark: Mark; actions: Set<string> }) {
  const sync = useSyncMark();
  const [open, setOpen] = useState<Open>(null);
  if (!actions.size) return null;

  async function act(fn: () => Promise<unknown>, success: string) {
    try {
      const res = await fn();
      toast.success(success);
      await sync(res, mark.item_id);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as Error).message);
      throw e;
    }
  }

  const primary = ["MODERATE", "APPROVE", "PUBLISH", "SUBMIT_FOR_MODERATION", "EDIT"].find((a) => actions.has(a));
  const variant = (a: string) => (a === primary ? "primary" : "outline") as "primary" | "outline";
  const editHref = mark.item_id
    ? `/dashboard/assessments/${mark.item_id}?${new URLSearchParams({
        ...(mark.course_id ? { course: mark.course_id } : {}),
        ...(mark.user_id ? { learner: mark.user_id } : {}),
      }).toString()}`
    : null;

  return (
    <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
      {actions.has("DISPUTE") && (
        <Button variant="soft-danger" icon={MessageSquareWarning} onClick={() => setOpen("dispute")}>
          Dispute
        </Button>
      )}
      {actions.has("EDIT") && editHref && (
        <ButtonLink href={editHref} variant={variant("EDIT")} icon={PenLine}>
          Edit mark
        </ButtonLink>
      )}
      {actions.has("SUBMIT_FOR_MODERATION") && (
        <Button variant={variant("SUBMIT_FOR_MODERATION")} icon={Send} onClick={() => setOpen("submit")}>
          Send to moderation
        </Button>
      )}
      {actions.has("PUBLISH") && mark.item_id && (
        <Button variant={variant("PUBLISH")} icon={Megaphone} onClick={() => setOpen("publish")}>
          Publish result
        </Button>
      )}
      {actions.has("APPROVE") && (
        <Button variant={variant("APPROVE")} icon={Gavel} onClick={() => setOpen("approve")}>
          Approve
        </Button>
      )}
      {actions.has("MODERATE") && (
        <Button variant={variant("MODERATE")} icon={Scale} onClick={() => setOpen("moderate")}>
          Moderate
        </Button>
      )}

      <ConfirmDialog
        open={open === "submit"}
        onOpenChange={(v) => setOpen(v ? "submit" : null)}
        tone="brand"
        title="Send this mark to moderation?"
        description="A moderator will check the score and feedback. You won't be able to change it unless it's returned to you."
        confirmLabel="Send to moderation"
        onConfirm={() => act(() => studioApi.submitMark(mark.id), "Sent to moderation")}
      />
      <ConfirmDialog
        open={open === "publish"}
        onOpenChange={(v) => setOpen(v ? "publish" : null)}
        tone="brand"
        title="Publish this result?"
        description="The learner will see their final score and feedback. For a module gate, a pass unlocks the next module and running out of attempts resets it."
        confirmLabel="Publish result"
        onConfirm={() => act(() => studioApi.publishMarks(mark.item_id as string, { mark_ids: [mark.id] }), "Result published")}
      />
      <ConfirmDialog
        open={open === "dispute"}
        onOpenChange={(v) => setOpen(v ? "dispute" : null)}
        tone="warning"
        title="Dispute the moderation?"
        description="An approver will look at both marks and settle the final score."
        confirmLabel="Send dispute"
        reason={{ label: "Why do you disagree?", placeholder: "Explain which criteria you think were misjudged…", required: true, minLength: 10 }}
        onConfirm={(note) => act(() => studioApi.disputeMark(mark.id, note), "Dispute sent to approvers")}
      />
      {open === "moderate" && <ModerateDialog mark={mark} onClose={() => setOpen(null)} act={act} />}
      {open === "approve" && <ApproveDialog mark={mark} onClose={() => setOpen(null)} act={act} />}
    </div>
  );
}

type Act = (fn: () => Promise<unknown>, success: string) => Promise<void>;

function ModerateDialog({ mark, onClose, act }: { mark: Mark; onClose: () => void; act: Act }) {
  const [choice, setChoice] = useState<"APPROVE" | "AMEND" | "RETURN">("APPROVE");
  const [score, setScore] = useState(mark.score != null ? String(mark.score) : "");
  const [feedback, setFeedback] = useState(mark.feedback ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const n = Number(score);
  const scoreValid = score.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100;
  const valid = choice === "APPROVE" || (choice === "AMEND" ? scoreValid && note.trim().length > 0 : note.trim().length > 0);

  async function submit() {
    if (!valid) return;
    setBusy(true);
    try {
      const payload =
        choice === "APPROVE"
          ? { action: choice, ...(note.trim() ? { note: note.trim() } : {}) }
          : choice === "AMEND"
            ? { action: choice, score: n, feedback: feedback.trim() || undefined, note: note.trim() }
            : { action: choice, note: note.trim() };
      await act(
        () => studioApi.moderateMark(mark.id, payload),
        choice === "APPROVE" ? "Mark confirmed" : choice === "AMEND" ? "Mark amended" : "Returned to the marker",
      );
      onClose();
    } catch {
      // toast already shown
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => !v && !busy && onClose()}
      dismissible={!busy}
      icon={Scale}
      title="Moderate this mark"
      description={`The marker awarded ${mark.score ?? "—"}%${mark.recommendation ? ` and recommends ${mark.recommendation === "PASS" ? "a pass" : "not yet"}` : ""}.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={choice === "RETURN" ? "danger" : "primary"}
            icon={choice === "APPROVE" ? ClipboardCheck : choice === "AMEND" ? PenLine : Undo2}
            loading={busy}
            disabled={!valid}
            onClick={submit}
          >
            {choice === "APPROVE" ? "Confirm mark" : choice === "AMEND" ? "Save amendment" : "Return to marker"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          value={choice}
          onChange={setChoice}
          className="self-start"
          options={[
            { key: "APPROVE", label: "Agree" },
            { key: "AMEND", label: "Amend" },
            { key: "RETURN", label: "Return" },
          ]}
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {choice === "APPROVE"
            ? "You agree with the marker's score and feedback. It moves on for approval."
            : choice === "AMEND"
              ? "Set the score you think is right. The marker is told and can dispute it."
              : "Send it back to the marker with a note on what to reconsider."}
        </p>
        {choice === "AMEND" && (
          <>
            <Field label="Moderated score" required htmlFor="mod-score" error={score && !scoreValid ? "Enter 0–100." : undefined}>
              <Input id="mod-score" type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} className="w-32" />
            </Field>
            <Field label="Feedback for the learner" optional htmlFor="mod-feedback">
              <Textarea id="mod-feedback" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </Field>
          </>
        )}
        <Field
          label={choice === "APPROVE" ? "Note" : choice === "AMEND" ? "Why you amended it" : "What should the marker look at?"}
          required={choice !== "APPROVE"}
          optional={choice === "APPROVE"}
          htmlFor="mod-note"
        >
          <Textarea id="mod-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

function ApproveDialog({ mark, onClose, act }: { mark: Mark; onClose: () => void; act: Act }) {
  const disputed = mark.status === "DISPUTED" || !!mark.dispute_note;
  const effective = mark.moderated_score ?? mark.score;
  const [score, setScore] = useState(disputed ? "" : effective != null ? String(effective) : "");
  const [feedback, setFeedback] = useState("");
  const [note, setNote] = useState("");
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);

  const n = Number(score);
  const scoreGiven = score.trim() !== "";
  const scoreValid = !scoreGiven || (Number.isFinite(n) && n >= 0 && n <= 100);
  const valid = scoreValid && (!disputed || scoreGiven);
  const overriding = scoreGiven && n !== effective;

  async function submit() {
    if (!valid) return;
    setBusy(true);
    try {
      // The approve endpoint also takes final_score / final_feedback / publish (moderation doc §3).
      const payload: { note?: string; final_score?: number; final_feedback?: string; publish?: boolean } = {
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(scoreGiven && (disputed || overriding) ? { final_score: n } : {}),
        ...(feedback.trim() ? { final_feedback: feedback.trim() } : {}),
        publish,
      };
      await act(() => studioApi.approveMark(mark.id, payload), publish ? "Approved and published" : "Mark approved");
      onClose();
    } catch {
      // toast already shown
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(v) => !v && !busy && onClose()}
      dismissible={!busy}
      icon={Gavel}
      title={disputed ? "Settle the dispute" : "Approve this result"}
      description={
        disputed
          ? `Marker: ${mark.score ?? "—"}% · Moderator: ${mark.moderated_score ?? "—"}%. Set the final score.`
          : `The current score is ${effective ?? "—"}%. Approve it as is, or set a different final score.`
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button icon={publish ? Megaphone : Gavel} loading={busy} disabled={!valid} onClick={submit}>
            {publish ? "Approve & publish" : "Approve"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Final score"
          required={disputed}
          optional={!disputed}
          htmlFor="final-score"
          error={!scoreValid ? "Enter 0–100." : undefined}
          hint={disputed ? "Required to settle a dispute." : "Leave as is to keep the current score."}
        >
          <Input id="final-score" type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} className="w-32" />
        </Field>
        <Field label="Final feedback" optional htmlFor="final-feedback" hint="Replaces the feedback the learner sees.">
          <Textarea id="final-feedback" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </Field>
        <Field label="Note" optional htmlFor="approve-note">
          <Textarea id="approve-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Switch
          checked={publish}
          onChange={setPublish}
          label="Publish to the learner now"
          description="Otherwise it waits with the other approved results until someone publishes them."
        />
      </div>
    </Dialog>
  );
}

function MarkReviewSkeleton() {
  return (
    <>
      <Card>
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </Card>
      <Card>
        <Skeleton className="h-10 w-full" />
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-3 h-12 w-full" />
          </Card>
        ))}
      </div>
    </>
  );
}
