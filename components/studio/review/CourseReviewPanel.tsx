"use client";

// The "Review & history" tab of the course editor. Reads everything from
// useCourseEditor(); every write goes through run().
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  CheckCircle2,
  CornerUpLeft,
  Eye,
  GitBranch,
  GitCompareArrows,
  History,
  ListChecks,
  MessagesSquare,
  PenLine,
  RefreshCw,
  Rocket,
  Send,
  ShieldCheck,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import { Avatar, Badge, Button, ButtonLink, Callout, Card, CardHeader, EmptyState, Meta, Skeleton, Tabs, cn } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/overlays";
import { RevisionStatusBadge, RiskBadge, VersionBadge } from "@/components/studio/StatusBadges";
import { useCourseEditor } from "@/components/studio/editor/CourseEditorContext";
import { studioApi } from "@/lib/studio/api";
import { REVISION_KIND_LABELS, STAGE, formatDate, formatDateTime, relativeTime, stageLabel } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { CourseVersion, OpenRevisionSummary, Revision, RevisionKind, Stage } from "@/lib/studio/types";
import { CommentsPanel } from "./CommentsPanel";
import { DecisionTimeline } from "./DecisionTimeline";
import { DiffView, ReasonLine } from "./DiffView";
import { EvidencePanel } from "./EvidencePanel";
import { useCoursePermissions, useRevision, useRevisionDiff } from "./hooks";
import { LearnerPreviewSheet } from "./LearnerPreviewSheet";
import { StageStepper } from "./StageStepper";
import { SubmitForReviewDialog } from "./SubmitForReviewDialog";
import { buildAnchorOptions, currentRoundStages, errorMessage, personName } from "./utils";

type PanelTab = "changes" | "discussion" | "timeline" | "history";

export function CourseReviewPanel() {
  const { courseId, course, revision, governanceEnabled, lifecycle, isLoading } = useCourseEditor();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const detail = useRevision(revision?.id, { enabled: governanceEnabled });
  const permissions = useCoursePermissions(courseId);
  const perms = permissions.data?.permissions ?? [];

  if (isLoading) return <PanelSkeleton />;

  if (!governanceEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <Callout tone="info" icon={Rocket} title="Changes go live straight away">
          Content review is switched off on this platform, so there&apos;s no approval step. Every publish is still recorded below.
        </Callout>
        <VersionHistory courseId={courseId} perms={perms} lifecycle={lifecycle} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {revision ? (
        detail.isPending ? (
          <Skeleton className="h-56 w-full rounded-2xl" />
        ) : detail.isError || !detail.data ? (
          <Callout
            tone="danger"
            title="We couldn't load the review status"
            actions={
              <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => detail.refetch()}>
                Retry
              </Button>
            }
          >
            {errorMessage(detail.error)}
          </Callout>
        ) : (
          <ActiveRevision rev={detail.data} onSubmit={() => setSubmitOpen(true)} onPreview={() => setPreviewOpen(true)} />
        )
      ) : (
        <NoRevision lifecycle={lifecycle} courseId={courseId} onStart={() => setSubmitOpen(true)} onPreview={() => setPreviewOpen(true)} />
      )}

      {!revision && <HistorySection courseId={courseId} perms={perms} lifecycle={lifecycle} />}

      <SubmitForReviewDialog open={submitOpen} onOpenChange={setSubmitOpen} />
      <LearnerPreviewSheet open={previewOpen} onOpenChange={setPreviewOpen} revisionId={revision?.id} course={course} />
    </div>
  );
}

/* ───────────────────────── Active revision ───────────────────────── */

function ActiveRevision({ rev, onSubmit, onPreview }: { rev: Revision; onSubmit: () => void; onPreview: () => void }) {
  const { courseId, course, lifecycle, run } = useCourseEditor();
  const [tab, setTab] = useState<PanelTab>("changes");
  const [confirm, setConfirm] = useState<"withdraw" | "discard" | null>(null);
  const actions = rev.available_actions ?? [];
  const has = (a: string) => actions.includes(a as never);
  const permissions = useCoursePermissions(courseId);
  const perms = permissions.data?.permissions ?? [];

  const diff = useRevisionDiff(rev.id);
  const anchors = useMemo(
    () => buildAnchorOptions({ courseId, courseTitle: course?.title, sections: course?.sections, diff: diff.data }),
    [courseId, course?.title, course?.sections, diff.data],
  );
  const comments = useQuery({ queryKey: qk.comments(rev.id), queryFn: () => studioApi.listComments(rev.id), staleTime: 10_000 });
  const openComments = (comments.data ?? []).filter((c) => !c.parent_id && !c.resolved_at).length;

  const stages = currentRoundStages(rev.stages, rev.round);
  const lastDecision = [...(rev.decisions ?? [])].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  const lastReturn = lastDecision.find((d) => d.decision === "RETURNED_FOR_REVISION");
  const lastReject = lastDecision.find((d) => d.decision === "REJECTED");
  const isNew = rev.kind === "INITIAL";
  const neverSubmitted = rev.status === "DRAFT" && !rev.submitted_at && !rev.round;

  return (
    <>
      {/* Status hero */}
      <Card className="overflow-hidden !p-0">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <RevisionStatusBadge status={rev.status} />
              <Badge tone="neutral" size="sm">
                {REVISION_KIND_LABELS[rev.kind as RevisionKind] ?? rev.kind}
              </Badge>
              {rev.round ? <Badge tone="neutral">Round {rev.round}</Badge> : null}
              <RiskBadge risk={rev.effective_risk ?? rev.computed_risk} />
              <VersionBadge label={rev.proposed_version_label} />
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">{headline(rev)}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{subline(rev, isNew)}</p>
            {rev.change_summary && (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap border-l-2 border-brand-300 pl-3 text-sm leading-6 text-slate-700 dark:border-brand-500/50 dark:text-slate-200">
                {rev.change_summary}
              </p>
            )}
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-2 lg:justify-end">
            {has("SUBMIT") && (
              <Button icon={Send} onClick={onSubmit}>
                {rev.status === "RETURNED_FOR_REVISION" ? "Resubmit" : "Submit for review"}
              </Button>
            )}
            {has("WITHDRAW") && (
              <Button variant="outline" icon={Undo2} onClick={() => setConfirm("withdraw")}>
                Withdraw to edit
              </Button>
            )}
            <Button variant="outline" icon={Eye} onClick={onPreview}>
              Preview as learner
            </Button>
            {!neverSubmitted && (
              <ButtonLink href={`/dashboard/approval-centre/revisions/${rev.id}`} variant="ghost" iconRight={ArrowUpRight}>
                Review page
              </ButtonLink>
            )}
            {has("DISCARD") && (
              <Button variant="soft-danger" icon={Trash2} onClick={() => setConfirm("discard")}>
                Discard draft
              </Button>
            )}
          </div>
        </div>

        {(rev.submitted_at || rev.author || !!rev.risk_reasons?.length) && (
          <div className="grid gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 dark:border-ink-line dark:bg-white/[0.015]">
            <Meta label="Author">{personName(rev.author, "—")}</Meta>
            <Meta label="Submitted">{rev.submitted_at ? <span title={formatDateTime(rev.submitted_at)}>{relativeTime(rev.submitted_at)}</span> : "Not yet"}</Meta>
            <Meta label="Waiting on">{rev.current_stage && !neverSubmitted ? stageLabel(rev.current_stage) : "—"}</Meta>
            <Meta label="Will publish as">{rev.proposed_version_label ? `Version ${rev.proposed_version_label}` : "Decided on submit"}</Meta>
          </div>
        )}

        {stages.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-5 sm:px-6 dark:border-ink-line">
            <StageStepper stages={rev.stages} round={rev.round} currentStage={rev.current_stage} />
          </div>
        )}
        {!!rev.risk_reasons?.length && !neverSubmitted && (
          <details className="group border-t border-slate-100 px-5 py-3 sm:px-6 dark:border-ink-line">
            <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
              Why this review route? <span className="text-slate-400 group-open:hidden">({rev.risk_reasons.length} reasons)</span>
            </summary>
            <ul className="mt-2 space-y-1">
              {rev.risk_reasons.map((r, i) => (
                <ReasonLine key={i} reason={r} />
              ))}
            </ul>
          </details>
        )}
      </Card>

      {/* Contextual banners */}
      {rev.status === "RETURNED_FOR_REVISION" && (
        <Callout tone="warning" icon={CornerUpLeft} title={`Changes requested by ${personName(lastReturn?.actor, "a reviewer")}`}>
          <p className="whitespace-pre-wrap">{lastReturn?.comment || "Check the discussion for details."}</p>
          <p className="mt-1 text-xs">Editing is unlocked. Fix things, reply to comments, then resubmit — review restarts from the first stage.</p>
        </Callout>
      )}
      {rev.status === "REJECTED" && (
        <Callout tone="danger" icon={XCircle} title={`Rejected by ${personName(lastReject?.actor, "a reviewer")}`}>
          <p className="whitespace-pre-wrap">{lastReject?.comment || "No reason was given."}</p>
          <p className="mt-1 text-xs">
            {isNew ? "Your content is kept — improve it and a new draft opens on your next edit." : "The live course is untouched. Your next edit starts a fresh draft."}
          </p>
        </Callout>
      )}
      {rev.status === "READY_TO_PUBLISH" && (
        <Callout tone="success" icon={CheckCircle2} title="Approved — waiting for a platform admin to publish">
          Every required stage has signed off. Version {rev.proposed_version_label ?? "—"} goes live as soon as it&apos;s published.
        </Callout>
      )}
      {rev.status === "PUBLISHED" && (
        <Callout tone="success" icon={Rocket} title={`Version ${rev.proposed_version_label ?? ""} is live`}>
          Published {rev.published_at ? relativeTime(rev.published_at) : ""}. Learners now see these changes.
        </Callout>
      )}
      {!!rev.open_conditions?.length && (
        <Callout tone="warning" icon={ListChecks} title="Minor changes the next reviewer will check">
          <ul className="mt-1 space-y-1">
            {rev.open_conditions.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                <span>
                  {c.text}
                  {c.stage && <span className="text-xs text-slate-500"> — {stageLabel(c.stage)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Callout>
      )}
      {neverSubmitted && (
        <Callout tone="brand" icon={PenLine} title="You're working on a draft">
          {lifecycle === "PUBLISHED"
            ? "Learners keep seeing the live version until your changes are approved and published."
            : "Nothing is visible to learners yet. When it's ready, submit it for review."}
        </Callout>
      )}

      {/* Tabs */}
      <div>
        <Tabs<PanelTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "changes", label: "What changed", icon: GitCompareArrows, count: diff.data?.changes?.length },
            { key: "discussion", label: "Discussion", icon: MessagesSquare, count: openComments, tone: openComments ? "warning" : undefined },
            { key: "timeline", label: "Decisions", icon: ShieldCheck, count: rev.decisions?.length },
            { key: "history", label: "History", icon: History },
          ]}
        />
        <div className="mt-5">
          {tab === "changes" && <DiffView revisionId={rev.id} />}
          {tab === "discussion" && (
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <CommentsPanel revisionId={rev.id} canComment={has("COMMENT")} anchors={anchors} />
              <EvidencePanel revisionId={rev.id} canAttach={has("ATTACH_EVIDENCE")} />
            </div>
          )}
          {tab === "timeline" && (
            <Card>
              <CardHeader icon={ShieldCheck} title="Decisions" description="Every reviewer decision on this revision, newest first." />
              <DecisionTimeline decisions={rev.decisions} revision={rev} />
            </Card>
          )}
          {tab === "history" && <HistorySection courseId={courseId} perms={perms} lifecycle={lifecycle} />}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "withdraw"}
        onOpenChange={(v) => !v && setConfirm(null)}
        tone="warning"
        title="Withdraw from review?"
        description="Your course goes back to draft so you can edit it. When you resubmit, reviewers start again from the first stage."
        confirmLabel="Withdraw"
        onConfirm={async () => {
          const ok = await run(() => studioApi.withdraw(rev.id), { success: "Withdrawn — you can edit again" });
          if (!ok) throw new Error("failed");
        }}
      />
      <ConfirmDialog
        open={confirm === "discard"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Discard this draft?"
        description={
          isNew
            ? "This closes the draft revision. Your course content is kept — your next edit opens a new draft."
            : "All unpublished changes in this draft are thrown away. The live course learners see is untouched."
        }
        confirmLabel="Discard draft"
        onConfirm={async () => {
          const ok = await run(() => studioApi.discard(rev.id), { success: "Draft discarded" });
          if (!ok) throw new Error("failed");
        }}
      />
    </>
  );
}

function headline(rev: Revision) {
  switch (rev.status) {
    case "DRAFT":
      return rev.round ? "Back in draft" : "Draft in progress";
    case "RETURNED_FOR_REVISION":
      return "Changes requested";
    case "READY_TO_PUBLISH":
      return "Approved and ready to publish";
    case "PUBLISHED":
      return "Published";
    case "REJECTED":
      return "Not approved";
    case "WITHDRAWN":
      return "Discarded";
    default:
      return rev.current_stage ? `In ${STAGE[rev.current_stage as Stage]?.label.toLowerCase() ?? "review"}` : "In review";
  }
}

function subline(rev: Revision, isNew: boolean) {
  if (rev.status === "DRAFT")
    return isNew ? "Build your course, then submit it. New courses always get the full review." : "Your edits are collecting here. Submit them when you're ready.";
  if (rev.status === "RETURNED_FOR_REVISION") return "A reviewer sent it back. Make the changes and resubmit.";
  if (rev.status === "READY_TO_PUBLISH") return "Every required reviewer has approved it.";
  if (rev.status === "PUBLISHED") return "These changes are live for learners.";
  if (rev.status === "REJECTED") return "This revision is closed.";
  return "The course is read-only while it's being reviewed. Withdraw it if you need to make changes.";
}

/* ───────────────────────── No revision ───────────────────────── */

const PIPELINE: { label: string; hint: string; icon: typeof Send }[] = [
  { label: "Build", hint: "Edit privately", icon: PenLine },
  { label: "Submit", hint: "Say what changed", icon: Send },
  { label: "Review", hint: "Reviewers sign off", icon: ShieldCheck },
  { label: "Publish", hint: "Goes live", icon: Rocket },
];

function NoRevision({
  lifecycle,
  courseId,
  onStart,
  onPreview,
}: {
  lifecycle: string;
  courseId: string;
  onStart: () => void;
  onPreview: () => void;
}) {
  const revisions = useQuery({ queryKey: qk.revisions(courseId), queryFn: () => studioApi.listRevisions(courseId), staleTime: 30_000 });
  const latest = revisions.data?.[0];
  const latestDetail = useRevision(latest?.status === "REJECTED" ? latest.id : null);
  const rejection = [...(latestDetail.data?.decisions ?? [])].reverse().find((d) => d.decision === "REJECTED");
  const isLive = lifecycle === "PUBLISHED";
  const archived = lifecycle === "ARCHIVED";

  return (
    <>
      {latest?.status === "REJECTED" && (
        <Callout tone="danger" icon={XCircle} title={`Your last submission was rejected${rejection?.actor?.name ? ` by ${rejection.actor.name}` : ""}`}>
          <p className="whitespace-pre-wrap">{rejection?.comment || "Open it to see the reviewers' comments."}</p>
          <p className="mt-1 text-xs">Nothing is lost — improve the course and submit again.</p>
        </Callout>
      )}
      <Card className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl dark:bg-brand-400/10" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">How review works</p>
            <h2 className="mt-1.5 font-display text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {archived ? "This course is archived" : isLive ? "Everything is live" : "Ready when you are"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {archived
                ? "Learners can't see it. A platform admin can reinstate it, which goes through a quick approval."
                : isLive
                  ? "Edit the course and your changes collect in a private draft. Learners keep seeing the live version until a reviewer approves your update."
                  : "Build your course privately, then submit it. Reviewers check accuracy, assessments and quality before a platform admin publishes version 1.0."}
            </p>
            {!archived && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button icon={Send} onClick={onStart}>
                  Start review
                </Button>
                <Button variant="outline" icon={Eye} onClick={onPreview}>
                  Preview as learner
                </Button>
              </div>
            )}
          </div>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[460px]">
            {PIPELINE.map((p, i) => (
              <li key={p.label} className="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white/80 px-2 py-3 text-center dark:border-ink-line dark:bg-white/[0.03]">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full",
                    i === 0 ? "bg-brand-600 text-white dark:bg-brand-400 dark:text-[#06130d]" : "bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300",
                  )}
                >
                  <p.icon className="h-4 w-4" />
                </span>
                <span className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{p.label}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{p.hint}</span>
              </li>
            ))}
          </ol>
        </div>
      </Card>
    </>
  );
}

/* ───────────────────────── History ───────────────────────── */

function HistorySection({ courseId, perms, lifecycle }: { courseId: string; perms: string[]; lifecycle: string }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <VersionHistory courseId={courseId} perms={perms} lifecycle={lifecycle} />
      <div className="flex flex-col gap-6">
        <RevisionHistory courseId={courseId} />
        {perms.includes("ARCHIVE_CONTENT") && <LifecycleCard courseId={courseId} lifecycle={lifecycle} />}
      </div>
    </div>
  );
}

function VersionHistory({ courseId, perms, lifecycle }: { courseId: string; perms: string[]; lifecycle: string }) {
  const { run } = useCourseEditor();
  const query = useQuery({ queryKey: qk.versions(courseId), queryFn: () => studioApi.listVersions(courseId), staleTime: 30_000 });
  const [target, setTarget] = useState<CourseVersion | null>(null);
  const canRollback = lifecycle === "PUBLISHED" && (perms.includes("APPROVE_COURSE") || perms.includes("FINAL_APPROVAL"));
  const versions = query.data ?? [];

  return (
    <Card>
      <CardHeader icon={GitBranch} title="Version history" description="Every published version, who wrote it and who approved it." />
      {query.isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <Callout
          tone="danger"
          title="Versions didn't load"
          actions={
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          }
        >
          {errorMessage(query.error)}
        </Callout>
      ) : versions.length === 0 ? (
        <EmptyState compact icon={GitBranch} title="Not published yet" description="Version 1.0 appears here the first time the course is published." />
      ) : (
        <ol className="relative flex flex-col gap-3">
          {versions.map((v) => (
            <li
              key={v.id}
              className={cn(
                "rounded-xl border p-4",
                v.is_current ? "border-brand-200 bg-brand-50/40 dark:border-brand-500/30 dark:bg-brand-400/[0.05]" : "border-slate-200 dark:border-ink-line",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-extrabold text-slate-900 dark:text-white">v{v.label}</span>
                    {v.is_current && (
                      <Badge tone="success" dot pulse size="xs">
                        Live now
                      </Badge>
                    )}
                    <RiskBadge risk={v.risk_level} size="xs" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {v.published_at ? `Published ${formatDate(v.published_at)}` : "Not published"}
                    {v.published_by?.name && ` by ${v.published_by.name}`}
                  </p>
                </div>
                {canRollback && !v.is_current && v.has_snapshot !== false && (
                  <Button size="sm" variant="outline" icon={Undo2} onClick={() => setTarget(v)}>
                    Roll back to this
                  </Button>
                )}
              </div>
              {v.reason && <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{v.reason}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                {v.author?.name && (
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar name={v.author.name} size="xs" /> Written by {v.author.name}
                  </span>
                )}
                {!!v.reviewers?.length && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex -space-x-1.5">
                      {v.reviewers.slice(0, 4).map((r, i) => (
                        <Avatar key={r.id ?? i} name={r.name} size="xs" />
                      ))}
                    </span>
                    Approved by {v.reviewers.map((r) => r.name).filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        open={!!target}
        onOpenChange={(v) => !v && setTarget(null)}
        tone="warning"
        title={`Roll back to version ${target?.label ?? ""}?`}
        description="This opens a rollback revision that restores that version's content. It needs Head of Learning approval from someone other than you, then publishes as a new version — history is never rewritten."
        confirmLabel="Start rollback"
        reason={{ label: "Why roll back?", placeholder: "e.g. The 2.0 assessment changes confused learners" }}
        onConfirm={async (reason) => {
          if (!target) return;
          const ok = await run(() => studioApi.rollback(courseId, target.id, reason || undefined), { success: "Rollback started — it's now waiting for approval" });
          if (!ok) throw new Error("failed");
        }}
      />
    </Card>
  );
}

function RevisionHistory({ courseId }: { courseId: string }) {
  const query = useQuery({ queryKey: qk.revisions(courseId), queryFn: () => studioApi.listRevisions(courseId), staleTime: 30_000 });
  const list = query.data ?? [];
  return (
    <Card>
      <CardHeader icon={History} title="All revisions" description="Every batch of changes, including withdrawn and rejected ones." />
      {query.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : query.isError ? (
        <Callout tone="danger" title="Revisions didn't load" actions={<Button size="sm" variant="outline" onClick={() => query.refetch()}>Retry</Button>}>
          {errorMessage(query.error)}
        </Callout>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No revisions yet. One opens with your first edit.</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {list.map((r: OpenRevisionSummary & { proposed_version_label?: string }) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/approval-centre/revisions/${r.id}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{REVISION_KIND_LABELS[r.kind] ?? r.kind}</span>
                    <RevisionStatusBadge status={r.status} size="xs" />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {[personName(r.author, ""), r.round ? `Round ${r.round}` : null, formatDate(r.created_at)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-colors group-hover:text-slate-600" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LifecycleCard({ courseId, lifecycle }: { courseId: string; lifecycle: string }) {
  const { run } = useCourseEditor();
  const [confirm, setConfirm] = useState<"archive" | "reinstate" | null>(null);
  if (lifecycle !== "PUBLISHED" && lifecycle !== "ARCHIVED") return null;
  return (
    <Card>
      <CardHeader icon={Archive} title="Lifecycle" description="Platform admin controls." />
      {lifecycle === "PUBLISHED" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Archiving hides the course from learners and withdraws any open revision. History is kept.</p>
          <Button variant="soft-danger" icon={Archive} className="self-start" onClick={() => setConfirm("archive")}>
            Archive course
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Reinstating opens a low-risk revision: one quick approval, then publish.</p>
          <Button variant="secondary" icon={ArchiveRestore} className="self-start" onClick={() => setConfirm("reinstate")}>
            Reinstate course
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirm === "archive"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Archive this course?"
        description="Learners will no longer see it. Any revision in progress is withdrawn. Versions and history are kept, and it can be reinstated later."
        confirmLabel="Archive"
        reason={{ label: "Reason", placeholder: "e.g. Superseded by the 2026 curriculum" }}
        onConfirm={async (reason) => {
          const ok = await run(() => studioApi.archive(courseId, reason || undefined), { success: "Course archived" });
          if (!ok) throw new Error("failed");
        }}
      />
      <ConfirmDialog
        open={confirm === "reinstate"}
        onOpenChange={(v) => !v && setConfirm(null)}
        tone="brand"
        title="Reinstate this course?"
        description="This creates a reinstatement revision that needs one quick approval before it's published again."
        confirmLabel="Reinstate"
        reason={{ label: "Reason", placeholder: "e.g. Back in the 2027 programme" }}
        onConfirm={async (reason) => {
          const ok = await run(() => studioApi.reinstate(courseId, reason || undefined), { success: "Reinstatement submitted for quick approval" });
          if (!ok) throw new Error("failed");
        }}
      />
    </Card>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
