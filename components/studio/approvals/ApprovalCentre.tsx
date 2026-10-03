"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  AlarmClock,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CornerUpLeft,
  FilePenLine,
  Inbox,
  PenLine,
  RefreshCw,
  Rocket,
  Search,
  Send,
  UserRoundSearch,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Badge, Button, Callout, Card, EmptyState, Input, PageHeader, Segmented, Skeleton, Tabs, cn, type TabDef } from "@/components/ui/primitives";
import { RevisionStatusBadge, RiskBadge, VersionBadge } from "@/components/studio/StatusBadges";
import { studioApi } from "@/lib/studio/api";
import { APPROVAL_ITEM_TYPES, DECISION, formatDateTime, humanize, relativeTime, stageLabel } from "@/lib/studio/labels";
import { qk } from "@/lib/studio/queryKeys";
import type { ApprovalCounts, ApprovalRow, ApprovalView, Decision, PaginatedMeta } from "@/lib/studio/types";
import { errorMessage } from "@/components/studio/review/utils";
import { useSubmittedReviews, type SubmittedRow } from "./useSubmittedReviews";

/** API inbox views plus "submitted", which the app assembles itself (see useSubmittedReviews). */
export type InboxView = ApprovalView | "submitted";

export type ApprovalCentreInit = {
  view: InboxView;
  reviewerMode: boolean;
  canPublish: boolean;
  /** Can send work for review — shows the "Submitted" tab. */
  canSubmit: boolean;
  userId?: string | null;
  counts: ApprovalCounts | null;
  rows: ApprovalRow[] | null;
  meta?: PaginatedMeta;
};

type Kind = "ALL" | "COURSE_REVISION" | "ESSAY_MARK";

const PAGE_SIZE = 30;

const EMPTY: Record<InboxView, { icon: LucideIcon; title: string; description: string }> = {
  awaiting_me: {
    icon: CheckCircle2,
    title: "You're all caught up",
    description: "Nothing is waiting for your decision. New items land here as soon as they reach a stage you can review.",
  },
  overdue: { icon: AlarmClock, title: "Nothing overdue", description: "Every review you're responsible for is on schedule. Nice." },
  ready_to_publish: {
    icon: Rocket,
    title: "Nothing ready to publish",
    description: "Revisions appear here once every required reviewer has approved them.",
  },
  returned_to_me: {
    icon: CornerUpLeft,
    title: "Nothing returned to you",
    description: "If a reviewer asks for changes on your work, it shows up here with their comments.",
  },
  submitted: {
    icon: Send,
    title: "Nothing in review",
    description: "Courses you submit for review appear here while reviewers work through them — with the stage they're at, who has them and when it's due.",
  },
  my_drafts: {
    icon: FilePenLine,
    title: "No open drafts",
    description: "Start editing a course and your draft shows up here until you submit it.",
  },
  recently_approved: { icon: CheckCircle2, title: "No recent approvals", description: "Approvals from the last 30 days on your work or your decisions." },
  recently_rejected: { icon: XCircle, title: "No recent rejections", description: "Rejections from the last 30 days on your work or your decisions." },
};

export function ApprovalCentre({ init }: { init: ApprovalCentreInit }) {
  const { reviewerMode, canPublish, canSubmit } = init;
  const [view, setView] = useState<InboxView>(init.view);
  const isSubmitted = view === "submitted";
  // Loaded up front (not only on the tab) so its count badge is accurate.
  const submitted = useSubmittedReviews(init.userId, canSubmit);
  const [kind, setKind] = useState<Kind>("ALL");
  const [search, setSearch] = useState("");

  const counts = useQuery({
    queryKey: qk.approvalCounts(),
    queryFn: () => studioApi.approvalCounts(),
    initialData: init.counts ?? undefined,
    staleTime: 15_000,
  });

  const seedInitial = view === init.view && kind === "ALL" && init.rows !== null;
  const apiView: ApprovalView = isSubmitted ? "my_drafts" : view;
  const list = useInfiniteQuery({
    queryKey: qk.approval(apiView, kind === "ALL" ? undefined : kind),
    queryFn: ({ pageParam }) =>
      studioApi.approvalCentre({ view: apiView, kind: kind === "ALL" ? undefined : kind, page: pageParam, page_size: PAGE_SIZE }),
    enabled: !isSubmitted,
    initialPageParam: 1,
    getNextPageParam: (last, _all, lastParam) => (last.meta?.has_next ? lastParam + 1 : undefined),
    initialData: seedInitial ? { pages: [{ items: init.rows ?? [], meta: init.meta }], pageParams: [1] } : undefined,
    staleTime: 15_000,
  });

  const rows = useMemo<SubmittedRow[]>(() => {
    const all: SubmittedRow[] = isSubmitted
      ? kind === "ESSAY_MARK"
        ? []
        : (submitted.data ?? [])
      : (list.data?.pages.flatMap((p) => p.items) ?? []);
    const q = search.trim().toLowerCase();
    return q ? all.filter((r) => [r.item_title, r.course_title].some((t) => t?.toLowerCase().includes(q))) : all;
  }, [isSubmitted, kind, submitted.data, list.data, search]);

  const c = counts.data ?? {};
  const tabs: TabDef<InboxView>[] = [
    { key: "awaiting_me", label: "Awaiting me", icon: Inbox, count: c.awaiting_me, tone: "brand", hidden: !reviewerMode },
    { key: "overdue", label: "Overdue", icon: AlarmClock, count: c.overdue, tone: "danger", hidden: !reviewerMode },
    { key: "ready_to_publish", label: "Ready to publish", icon: Rocket, count: c.ready_to_publish, tone: "success", hidden: !canPublish },
    { key: "returned_to_me", label: "Returned to me", icon: CornerUpLeft, count: c.returned_to_me, tone: "warning" },
    { key: "submitted", label: "Submitted", icon: Send, count: submitted.data?.length, tone: "info", hidden: !canSubmit },
    { key: "my_drafts", label: "My drafts", icon: FilePenLine },
    { key: "recently_approved", label: "Recently approved", icon: CheckCircle2 },
    { key: "recently_rejected", label: "Recently rejected", icon: XCircle },
  ];

  function changeView(v: InboxView) {
    setView(v);
    setSearch("");
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("view", v);
      window.history.replaceState(null, "", url.toString());
    } catch {
      // ignore — the deep link is a convenience
    }
  }

  const recent = view === "recently_approved" || view === "recently_rejected";
  const empty = EMPTY[view];
  const urgent = (c.overdue ?? 0) > 0 && reviewerMode;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Inbox"
        title="Approval Centre"
        description={
          reviewerMode
            ? "Everything waiting for your review, your own submissions and drafts, and recent decisions — in one place."
            : "Your drafts, what you've submitted for review, anything returned to you, and recent decisions on your work."
        }
        actions={
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={list.isRefetching || counts.isRefetching || submitted.isRefetching}
            onClick={() => {
              void counts.refetch();
              if (isSubmitted) void submitted.refetch();
              else void list.refetch();
            }}
          >
            Refresh
          </Button>
        }
      />

      {urgent && view !== "overdue" && (
        <Callout
          tone="danger"
          icon={AlarmClock}
          title={`${c.overdue} ${c.overdue === 1 ? "review is" : "reviews are"} overdue`}
          actions={
            <Button size="sm" variant="outline" onClick={() => changeView("overdue")}>
              View overdue
            </Button>
          }
        >
          Authors are waiting on these — take a look when you can.
        </Callout>
      )}

      <div>
        <Tabs tabs={tabs} value={view} onChange={changeView} />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented<Kind>
            size="sm"
            value={kind}
            onChange={setKind}
            options={[
              { key: "ALL", label: "All" },
              { key: "COURSE_REVISION", label: "Course revisions", icon: BookOpen },
              { key: "ESSAY_MARK", label: "Essay marks", icon: PenLine },
            ]}
          />
          <Input
            aria-label="Search by title"
            placeholder="Search by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leading={<Search className="h-4 w-4" />}
            className="h-9 sm:w-72"
          />
        </div>
      </div>

      {(isSubmitted ? submitted.isPending : list.isPending) ? (
        <Card padded={false} className="divide-y divide-slate-100 dark:divide-ink-line">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="hidden h-6 w-24 rounded-full sm:block" />
            </div>
          ))}
        </Card>
      ) : (isSubmitted ? submitted.isError : list.isError) ? (
        <Callout
          tone="danger"
          title="We couldn't load this inbox"
          actions={
            <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => (isSubmitted ? submitted.refetch() : list.refetch())}>
              Retry
            </Button>
          }
        >
          {errorMessage(isSubmitted ? submitted.error : list.error)}
        </Callout>
      ) : rows.length === 0 ? (
        search.trim() ? (
          <EmptyState icon={Search} title="No matches" description={`Nothing in this view matches “${search.trim()}”.`} />
        ) : (
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            action={
              view === "my_drafts" || view === "submitted" ? (
                <Link href="/dashboard/courses" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                  Go to my courses →
                </Link>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          {isSubmitted && (
            <p className="-mb-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <UserRoundSearch className="h-3.5 w-3.5" />
              {rows.length} of your submission{rows.length === 1 ? " is" : "s are"} with reviewers. Open one to follow its progress or withdraw it.
            </p>
          )}
          <Card padded={false} className="overflow-hidden">
            <ul className="divide-y divide-slate-100 dark:divide-ink-line">
              {rows.map((r) => (
                <InboxRow key={`${r.kind}-${r.id}`} row={r} recent={recent} submitted={isSubmitted} />
              ))}
            </ul>
          </Card>
          {!isSubmitted && list.hasNextPage && !search.trim() && (
            <Button variant="outline" className="self-center" loading={list.isFetchingNextPage} onClick={() => list.fetchNextPage()}>
              Load more
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function InboxRow({ row: r, recent, submitted }: { row: SubmittedRow; recent: boolean; submitted?: boolean }) {
  const isMark = r.kind === "ESSAY_MARK";
  const href = isMark ? `/dashboard/approval-centre/marks/${r.id}` : `/dashboard/approval-centre/revisions/${r.id}`;
  const Icon = isMark ? PenLine : BookOpen;
  const typeLabel = (r.item_type && APPROVAL_ITEM_TYPES[r.item_type]) || r.item_type || (isMark ? "Essay mark" : "Course revision");
  const showCourse = r.course_title && r.course_title !== r.item_title;
  const decision = r.decision ? DECISION[r.decision as Decision] ?? { label: humanize(r.decision), tone: "neutral" as const } : null;

  return (
    <li>
      <Link
        href={href}
        className="group grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50/80 sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-5 dark:hover:bg-white/[0.02]"
      >
        {/* Title */}
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ring-1 ring-inset",
              isMark
                ? "bg-violet-50 text-violet-600 ring-violet-200/70 dark:bg-violet-500/12 dark:text-violet-300 dark:ring-violet-400/20"
                : "bg-brand-50 text-brand-600 ring-brand-200/70 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
              {r.item_title || r.course_title || "Untitled"}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {typeLabel}
              {showCourse && <> · {r.course_title}</>}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-wrap items-center gap-1.5 pl-[52px] lg:pl-0">
          {recent && decision ? (
            <Badge size="xs" tone={decision.tone}>
              {decision.label}
            </Badge>
          ) : isMark ? (
            r.status && (
              <Badge size="xs" tone="violet">
                {humanize(r.status)}
              </Badge>
            )
          ) : (
            <RevisionStatusBadge status={r.status} size="xs" />
          )}
          {r.current_stage && !recent && (
            <Badge size="xs">
              {submitted && r.progress ? `Stage ${Math.min(r.progress.done + 1, r.progress.total)} of ${r.progress.total} · ` : ""}
              {stageLabel(r.current_stage)}
            </Badge>
          )}
          <RiskBadge risk={r.risk} size="xs" />
          <VersionBadge label={r.version_label} size="xs" />
        </div>

        {/* People */}
        <div className="flex min-w-0 items-center gap-4 pl-[52px] text-xs text-slate-500 lg:pl-0 dark:text-slate-400">
          {submitted ? (
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate">
                {r.reviewer?.name ? (
                  <>
                    With <span className="font-medium text-slate-700 dark:text-slate-200">{r.reviewer.name}</span>
                  </>
                ) : r.status === "READY_TO_PUBLISH" ? (
                  "Waiting for an admin to publish"
                ) : (
                  "Waiting for a reviewer to pick it up"
                )}
              </span>
              {r.progress && (
                <span className="flex items-center gap-2">
                  <span className="h-1 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400"
                      style={{ width: `${(r.progress.done / r.progress.total) * 100}%` }}
                    />
                  </span>
                  <span className="tabular-nums">
                    {r.progress.done}/{r.progress.total} approved
                  </span>
                </span>
              )}
            </span>
          ) : r.submitted_by?.name && (
            <span className="flex min-w-0 items-center gap-1.5" title="Submitted by">
              <Avatar name={r.submitted_by.name} size="xs" />
              <span className="truncate">{r.submitted_by.name}</span>
            </span>
          )}
          {!submitted && r.reviewer?.name && (
            <span className="min-w-0 truncate" title={recent ? "Decided by" : "Reviewer"}>
              {recent ? "by" : "→"} {r.reviewer.name}
            </span>
          )}
        </div>

        {/* Due */}
        <div className="flex items-center justify-between gap-3 pl-[52px] lg:justify-end lg:pl-0">
          {r.due_at && !recent ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium",
                r.is_overdue ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400",
              )}
              title={formatDateTime(r.due_at)}
            >
              {r.is_overdue ? <AlarmClock className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
              {r.is_overdue ? `Overdue · ${relativeTime(r.due_at)}` : `Due ${relativeTime(r.due_at)}`}
            </span>
          ) : submitted && r.submitted_at ? (
            <span className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400" title={formatDateTime(r.submitted_at)}>
              Submitted {relativeTime(r.submitted_at)}
            </span>
          ) : (
            <span />
          )}
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
        </div>
      </Link>
    </li>
  );
}
