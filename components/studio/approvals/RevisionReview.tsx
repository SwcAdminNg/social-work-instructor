"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUpRight,
  CircleSlash,
  ClipboardCheck,
  Eye,
  FileQuestion,
  GitCompareArrows,
  Info,
  ListChecks,
  Lock,
  MessagesSquare,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Avatar, Badge, Button, ButtonLink, Callout, Card, EmptyState, Meta, Skeleton, Tabs } from "@/components/ui/primitives";
import { RevisionStatusBadge, RiskBadge, VersionBadge } from "@/components/studio/StatusBadges";
import { CommentsPanel } from "@/components/studio/review/CommentsPanel";
import { CoursePreview } from "@/components/studio/review/CoursePreview";
import { DecisionTimeline } from "@/components/studio/review/DecisionTimeline";
import { DiffView, ReasonLine } from "@/components/studio/review/DiffView";
import { EvidencePanel } from "@/components/studio/review/EvidencePanel";
import { useRevision, useRevisionDiff, useRevisionPreview, useRevisionTree } from "@/components/studio/review/hooks";
import { StageStepper } from "@/components/studio/review/StageStepper";
import { buildAnchorOptions, currentRoundStages, errorMessage, personName } from "@/components/studio/review/utils";
import { ApiError, studioApi } from "@/lib/studio/api";
import { REVISION_KIND_LABELS, RISK_FLAGS, formatDateTime, relativeTime, stageLabel } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { Revision, RevisionKind, RiskFlag } from "@/lib/studio/types";
import { AnswersTree } from "./AnswersTree";
import { DecisionBar, hasDecisionActions, type Perform } from "./DecisionBar";

type ReviewTab = "changes" | "preview" | "answers" | "discussion" | "timeline";

export function RevisionReview({
  id,
  initialRevision,
  initialError,
}: {
  id: string;
  initialRevision: Revision | null;
  initialError: { status: number; message: string } | null;
}) {
  const queryClient = useQueryClient();
  const query = useRevision(id, { initialData: initialRevision });
  const [tab, setTab] = useState<ReviewTab>("changes");

  const rev = query.data;
  const diff = useRevisionDiff(rev?.id);
  const preview = useRevisionPreview(rev?.id, tab === "preview");
  const tree = useRevisionTree(rev?.id, tab === "answers" || tab === "discussion");
  const course = useQuery({
    queryKey: [...qk.course(rev?.course_id ?? "none"), "review-hero"],
    queryFn: () => studioApi.getCourse(rev!.course_id!),
    enabled: !!rev?.course_id && tab === "preview",
    retry: false,
    staleTime: 60_000,
  });

  const anchors = useMemo(
    () => buildAnchorOptions({ courseId: rev?.course_id, courseTitle: rev?.course_title, sections: tree.data, diff: diff.data }),
    [rev?.course_id, rev?.course_title, tree.data, diff.data],
  );
  const comments = useQuery({
    queryKey: qk.comments(id),
    queryFn: () => studioApi.listComments(id),
    enabled: !!rev,
    staleTime: 10_000,
  });
  const openComments = (comments.data ?? []).filter((c) => !c.parent_id && !c.resolved_at).length;

  const perform: Perform = async (fn, success) => {
    try {
      const result = await fn();
      if (result && typeof result === "object" && "id" in result) queryClient.setQueryData(qk.revision(id), result);
      toast.success(typeof success === "function" ? success(result) : success);
      void queryClient.invalidateQueries({ queryKey: qk.all });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 409)) {
        toast.error(err.message);
        await queryClient.invalidateQueries({ queryKey: qk.revision(id) });
        return;
      }
      throw err;
    }
  };

  /* ───── Not found / no access ───── */
  if (!rev) {
    if (query.isPending && !initialError) return <ReviewSkeleton />;
    const status = query.error instanceof ApiError ? query.error.status : initialError?.status ?? 0;
    const message = query.error ? errorMessage(query.error) : initialError?.message;
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6">
        <BackLink />
        <EmptyState
          icon={status === 403 ? Lock : status === 404 ? FileQuestion : CircleSlash}
          title={status === 403 ? "You don't have access to this revision" : status === 404 ? "We can't find this revision" : "This revision didn't load"}
          description={
            status === 403
              ? "It may belong to a course you don't review, or your roles have changed. Ask a platform admin if you think you should see it."
              : status === 404
                ? "It may have been discarded, or the link is out of date."
                : message
          }
          action={
            <>
              <ButtonLink href="/dashboard/approval-centre" variant="outline" icon={ArrowLeft}>
                Back to the inbox
              </ButtonLink>
              {status !== 403 && status !== 404 && (
                <Button icon={RefreshCw} onClick={() => query.refetch()} loading={query.isFetching}>
                  Try again
                </Button>
              )}
            </>
          }
        />
      </div>
    );
  }

  const actions = rev.available_actions ?? [];
  const decisionActions = hasDecisionActions(actions);
  const authorish = actions.some((a) => a === "EDIT" || a === "SUBMIT" || a === "WITHDRAW" || a === "DISCARD");
  const stages = currentRoundStages(rev.stages, rev.round);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <BackLink />
        <Button size="sm" variant="ghost" icon={RefreshCw} onClick={() => query.refetch()} loading={query.isFetching}>
          Refresh
        </Button>
      </div>

      {/* Header */}
      <Card className="overflow-hidden !p-0">
        <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
              {REVISION_KIND_LABELS[rev.kind as RevisionKind] ?? "Revision"}
              {rev.round ? ` · Round ${rev.round}` : ""}
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[1.75rem] dark:text-white">
              {rev.course_title || "Untitled course"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RevisionStatusBadge status={rev.status} />
              {rev.current_stage && !["PUBLISHED", "REJECTED", "WITHDRAWN", "READY_TO_PUBLISH", "DRAFT"].includes(rev.status) && (
                <Badge tone="info">Waiting on {stageLabel(rev.current_stage).toLowerCase()}</Badge>
              )}
              <RiskBadge risk={rev.effective_risk ?? rev.computed_risk} />
              <VersionBadge label={rev.proposed_version_label} />
              {rev.touches_assessment && (
                <Badge tone="violet" icon={ClipboardCheck}>
                  Touches assessments
                </Badge>
              )}
              {(rev.risk_flags ?? []).map((f) => (
                <Badge key={f} tone="danger" size="xs">
                  {RISK_FLAGS[f as RiskFlag]?.label ?? f}
                </Badge>
              ))}
            </div>
          </div>
          {authorish && rev.course_id && (
            <ButtonLink href={`/dashboard/courses/${rev.course_id}?tab=review`} variant="outline" iconRight={ArrowUpRight}>
              Open in course editor
            </ButtonLink>
          )}
        </div>

        <div className="grid gap-6 border-t border-slate-100 px-5 py-5 sm:px-6 lg:grid-cols-[1.5fr_1fr] dark:border-ink-line">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">What the author says</p>
            {rev.change_summary ? (
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-100">{rev.change_summary}</p>
            ) : (
              <p className="mt-1.5 text-sm italic text-slate-400">Not submitted yet.</p>
            )}
            {rev.reason && (
              <>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Why</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{rev.reason}</p>
              </>
            )}
            {!!rev.risk_reasons?.length && (
              <details className="group mt-4">
                <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                  Why {rev.effective_risk ? rev.effective_risk.toLowerCase() : "this"} risk? <span className="text-slate-400 group-open:hidden">({rev.risk_reasons.length} reasons)</span>
                </summary>
                <ul className="mt-2 space-y-1">
                  {rev.risk_reasons.map((r, i) => (
                    <ReasonLine key={i} reason={r} />
                  ))}
                </ul>
              </details>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 self-start">
            <Meta label="Submitted by">
              <span className="flex items-center gap-2">
                <Avatar name={personName(rev.author)} size="xs" /> {personName(rev.author, "—")}
              </span>
            </Meta>
            <Meta label="Submitted">
              {rev.submitted_at ? <span title={formatDateTime(rev.submitted_at)}>{relativeTime(rev.submitted_at)}</span> : "—"}
            </Meta>
            <Meta label="Contributors" className="col-span-2">
              {rev.contributors?.length ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="flex -space-x-1.5">
                    {rev.contributors.slice(0, 5).map((c, i) => (
                      <Avatar key={c.id ?? i} name={c.name} size="xs" />
                    ))}
                  </span>
                  <span className="truncate font-normal text-slate-600 dark:text-slate-300">{rev.contributors.map((c) => c.name).filter(Boolean).join(", ")}</span>
                </span>
              ) : (
                "—"
              )}
            </Meta>
          </div>
        </div>

        {stages.length > 0 ? (
          <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:px-6 dark:border-ink-line dark:bg-white/[0.015]">
            <StageStepper stages={rev.stages} round={rev.round} currentStage={rev.current_stage} />
          </div>
        ) : rev.required_stages?.length ? (
          <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-5 sm:px-6 dark:border-ink-line dark:bg-white/[0.015]">
            <StageStepper planned={rev.required_stages} />
          </div>
        ) : null}
      </Card>

      {!!rev.open_conditions?.length && (
        <Callout tone="warning" icon={ListChecks} title="Confirm these minor changes before approving">
          <ul className="mt-1 space-y-1">
            {rev.open_conditions.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                <span>
                  {c.text}
                  {c.stage && <span className="text-xs text-slate-500"> — asked at {stageLabel(c.stage).toLowerCase()}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Callout>
      )}

      {!decisionActions && rev.blocked_reason && (
        <Callout tone="info" icon={Info} title="You can't decide this one">
          {rev.blocked_reason}
        </Callout>
      )}

      <div>
        <Tabs<ReviewTab>
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "changes", label: "What changed", icon: GitCompareArrows, count: diff.data?.changes?.length },
            { key: "preview", label: "Learner preview", icon: Eye },
            { key: "answers", label: "Answers & tree", icon: ClipboardCheck },
            { key: "discussion", label: "Discussion", icon: MessagesSquare, count: openComments, tone: openComments ? "warning" : undefined },
            { key: "timeline", label: "Timeline", icon: ShieldCheck, count: rev.decisions?.length },
          ]}
        />
        <div className="mt-5">
          {tab === "changes" && <DiffView revisionId={rev.id} />}
          {tab === "preview" && (
            <CoursePreview
              course={course.data}
              fallbackTitle={rev.course_title}
              sections={preview.data}
              loading={preview.isPending}
              error={preview.isError ? errorMessage(preview.error) : null}
              onRetry={() => preview.refetch()}
            />
          )}
          {tab === "answers" && (
            <AnswersTree
              sections={tree.data}
              loading={tree.isPending}
              error={tree.isError ? errorMessage(tree.error) : null}
              onRetry={() => tree.refetch()}
            />
          )}
          {tab === "discussion" && (
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <CommentsPanel revisionId={rev.id} canComment={actions.includes("COMMENT")} anchors={anchors} />
              <EvidencePanel revisionId={rev.id} canAttach={actions.includes("ATTACH_EVIDENCE")} />
            </div>
          )}
          {tab === "timeline" && (
            <Card>
              <DecisionTimeline decisions={rev.decisions} revision={rev} />
            </Card>
          )}
        </div>
      </div>

      <DecisionBar revision={rev} perform={perform} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/approval-centre"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" /> Approval Centre
    </Link>
  );
}

function ReviewSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-72 w-full rounded-2xl" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
