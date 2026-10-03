"use client";

import {
  AlarmClock,
  BookOpen,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  MessageSquareWarning,
  NotebookPen,
  PencilLine,
  Rocket,
} from "lucide-react";
import { StatCard } from "@/components/ui/primitives";
import { useAccess } from "@/components/studio/AccessContext";
import { courseLifecycle } from "@/components/studio/courses/courseStatus";
import { APPROVAL_ITEM_TYPES, isInReview, relativeTime, stageLabel } from "@/lib/studio/labels";
import type { ApprovalRow } from "@/lib/studio/types";
import { AdminOverviewStrip } from "./AdminOverviewStrip";
import { AttentionList, type AttentionItem } from "./AttentionList";
import { ContinueEditing } from "./ContinueEditing";
import { HomeHero } from "./HomeHero";
import { FirstRun } from "./PublishingExplainer";
import type { HomeData } from "./types";

const MAX_ATTENTION = 6;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function rowHref(row: ApprovalRow) {
  return row.kind === "ESSAY_MARK" ? `/dashboard/approval-centre/marks/${row.id}` : `/dashboard/approval-centre/revisions/${row.id}`;
}

function Due({ at }: { at?: string }) {
  if (!at) return null;
  return <span suppressHydrationWarning>due {relativeTime(at)}</span>;
}

export function DashboardHome({ data }: { data: HomeData }) {
  const { capabilities: caps, governanceEnabled } = useAccess();
  const inbox = governanceEnabled && !!caps.can_access_approval_centre;
  const reviewer = !!(caps.can_review_content || caps.can_force_approve);
  const counts = data.counts ?? {};

  /* ── Needs your attention ── */
  const items: AttentionItem[] = [];
  for (const row of data.returned) {
    const essay = row.kind === "ESSAY_MARK";
    items.push({
      key: `ret-${row.id}`,
      tone: "warning",
      icon: MessageSquareWarning,
      eyebrow: essay ? "Mark returned" : "Changes requested",
      title: (essay ? row.item_title : row.course_title) || row.item_title || "Untitled course",
      description: essay
        ? row.course_title
        : `${row.reviewer?.name ? `${row.reviewer.name} sent this back` : "A reviewer sent this back"} — read the feedback, make the changes and resubmit.`,
      href: essay || !row.course_id ? rowHref(row) : `/dashboard/courses/${row.course_id}?tab=review`,
      cta: essay ? "Open" : "See feedback",
    });
  }
  const awaitingTotal = Number(counts.awaiting_me ?? data.awaiting.length);
  for (const row of reviewer ? data.awaiting : []) {
    const type = APPROVAL_ITEM_TYPES[row.item_type ?? ""] ?? row.item_type ?? "Review";
    items.push({
      key: `await-${row.id}`,
      tone: row.is_overdue ? "danger" : "info",
      icon: row.is_overdue ? AlarmClock : row.kind === "ESSAY_MARK" ? NotebookPen : ClipboardCheck,
      eyebrow: row.is_overdue ? "Overdue review" : row.current_stage ? `${type} · ${stageLabel(row.current_stage)}` : type,
      title: row.item_title || row.course_title || "Untitled",
      description: [row.item_title !== row.course_title ? row.course_title : null, row.submitted_by?.name ? `from ${row.submitted_by.name}` : null]
        .filter(Boolean)
        .join(" · "),
      meta: <Due at={row.due_at} />,
      href: rowHref(row),
      cta: "Review",
    });
  }
  const overdueTotal = Number(counts.overdue ?? 0);
  if (inbox && overdueTotal > 0 && !data.awaiting.some((r) => r.is_overdue)) {
    items.push({
      key: "overdue",
      tone: "danger",
      icon: AlarmClock,
      eyebrow: "Overdue",
      title: `${plural(overdueTotal, "review")} past ${overdueTotal === 1 ? "its" : "their"} due date`,
      description: "Help keep courses moving — check who has them and nudge or reassign.",
      href: "/dashboard/approval-centre?view=overdue",
      cta: "View",
    });
  }
  const readyTotal = caps.can_publish ? Number(counts.ready_to_publish ?? 0) : 0;
  if (readyTotal > 0) {
    items.push({
      key: "ready",
      tone: "success",
      icon: Rocket,
      eyebrow: "Ready to publish",
      title: `${plural(readyTotal, "approved revision")} waiting to go live`,
      description: "Every required review is complete.",
      href: "/dashboard/approval-centre?view=ready_to_publish",
      cta: "Publish",
    });
  }
  for (const row of data.drafts) {
    items.push({
      key: `draft-${row.id}`,
      tone: "brand",
      icon: PencilLine,
      eyebrow: row.item_type === "Course" ? "Draft course" : "Unsubmitted changes",
      title: row.course_title || row.item_title || "Untitled course",
      description:
        row.item_type === "Course"
          ? "Keep building — submit it for review when it's ready."
          : "Learners still see the live version until these changes are approved.",
      href: row.course_id ? `/dashboard/courses/${row.course_id}?tab=curriculum` : rowHref(row),
      cta: "Continue",
    });
  }
  const attentionTotal =
    data.returned.length + (reviewer ? Math.max(awaitingTotal, data.awaiting.length) : 0) + (readyTotal ? 1 : 0) + data.drafts.length;

  /* ── Summary sentence ── */
  const urgent: string[] = [];
  const returnedCourses = data.returned.filter((r) => r.kind !== "ESSAY_MARK").length;
  if (returnedCourses) urgent.push(`${plural(returnedCourses, "course")} ${returnedCourses === 1 ? "needs" : "need"} changes`);
  if (reviewer && awaitingTotal) urgent.push(`${plural(awaitingTotal, "item")} ${awaitingTotal === 1 ? "is" : "are"} waiting for your review`);
  if (readyTotal) urgent.push(`${plural(readyTotal, "revision")} ${readyTotal === 1 ? "is" : "are"} ready to publish`);
  const firstRun = !!caps.can_edit_content && data.courseTotal === 0;
  let summary: string;
  if (urgent.length) {
    const s = urgent.length > 1 ? `${urgent.slice(0, -1).join(", ")} and ${urgent[urgent.length - 1]}` : urgent[0];
    summary = `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
  } else if (data.drafts.length) {
    summary = `You have ${plural(data.drafts.length, "draft")} in progress — nothing is blocked, so keep going.`;
  } else if (firstRun && caps.can_create_courses) {
    summary = "Welcome to your teaching workspace. Let's create your first course.";
  } else if (data.courses.length) {
    summary = "You're all caught up. A good moment to improve a course or start a new one.";
  } else {
    summary = "Here's what's happening in your workspace today.";
  }

  /* ── KPIs ── */
  const live = data.courses.filter((c) => courseLifecycle(c, governanceEnabled) === "PUBLISHED").length;
  const draftCourses = data.courses.filter((c) => courseLifecycle(c, governanceEnabled) === "DRAFT").length;
  const revStatuses = Object.values(data.revisions).map((r) => r.status);
  const inReview = revStatuses.filter((s) => isInReview(s) && s !== "READY_TO_PUBLISH").length;
  const approved = revStatuses.filter((s) => s === "READY_TO_PUBLISH").length;

  const stats: React.ComponentProps<typeof StatCard>[] = [];
  if (caps.can_edit_content) {
    stats.push({
      label: "My courses",
      value: data.courseTotal,
      hint: data.courseTotal ? `${live} live · ${draftCourses} in draft` : "None yet",
      icon: BookOpen,
      tone: "brand",
      href: "/dashboard/courses",
    });
    if (governanceEnabled) {
      stats.push({
        label: "In review",
        value: inReview,
        hint: approved ? `${approved} approved, awaiting publish` : inReview ? "With reviewers now" : "Nothing submitted",
        icon: Clock3,
        tone: "info",
        href: inbox ? "/dashboard/approval-centre" : "/dashboard/courses",
      });
    }
  }
  if (inbox && reviewer) {
    stats.push({
      label: "Awaiting me",
      value: awaitingTotal,
      hint: overdueTotal ? `${overdueTotal} overdue` : awaitingTotal ? "Ready for your decision" : "Queue is clear",
      icon: ClipboardCheck,
      tone: overdueTotal ? "danger" : awaitingTotal ? "warning" : "neutral",
      href: "/dashboard/approval-centre",
    });
  } else if (inbox && caps.can_edit_content) {
    const ret = Number(counts.returned_to_me ?? data.returned.length);
    stats.push({
      label: "Changes requested",
      value: ret,
      hint: ret ? "Reviewers left feedback" : "No returns",
      icon: MessageSquareWarning,
      tone: ret ? "warning" : "neutral",
      href: "/dashboard/approval-centre?view=returned_to_me",
    });
  }
  if (inbox && caps.can_publish) {
    stats.push({
      label: "Ready to publish",
      value: readyTotal,
      hint: readyTotal ? "Fully approved" : "Nothing waiting",
      icon: FileCheck2,
      tone: "success",
      href: "/dashboard/approval-centre?view=ready_to_publish",
    });
  }
  const statCols = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 xl:grid-cols-4" }[
    Math.min(stats.length, 4) as 1 | 2 | 3 | 4
  ];

  /* ── Continue editing ── */
  const rank = (id: string) => {
    const s = data.revisions[id]?.status;
    return s === "RETURNED_FOR_REVISION" ? 0 : s === "DRAFT" ? 1 : 2;
  };
  const recent = data.courses
    .filter((c) => courseLifecycle(c, governanceEnabled) !== "ARCHIVED")
    .map((c, i) => ({ c, i }))
    .sort((a, b) => rank(a.c.id) - rank(b.c.id) || a.i - b.i)
    .slice(0, 4)
    .map(({ c }) => c);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <HomeHero
        firstName={data.firstName}
        summary={summary}
        canCreate={!!caps.can_create_courses}
        showInbox={!!caps.can_access_approval_centre}
        inboxCount={data.returned.length + (reviewer ? awaitingTotal : 0)}
      />

      {stats.length > 0 && <div className={`grid gap-4 ${statCols}`}>{stats.map((s) => <StatCard key={s.label} {...s} />)}</div>}

      {firstRun && <FirstRun governanceEnabled={governanceEnabled} canCreate={!!caps.can_create_courses} />}

      {inbox && (
        <AttentionList
          items={items.slice(0, MAX_ATTENTION)}
          total={attentionTotal}
          inboxHref="/dashboard/approval-centre"
          emptyHint={
            caps.can_create_courses && !firstRun
              ? "No feedback to act on and nothing waiting for review."
              : "New reviews and returned work will appear here."
          }
        />
      )}

      {!firstRun && <ContinueEditing courses={recent} revisions={data.revisions} governanceEnabled={governanceEnabled} total={data.courseTotal} />}

      {data.adminOverview && (caps.can_publish || caps.can_manage_staff_roles) && <AdminOverviewStrip overview={data.adminOverview} />}
    </div>
  );
}
