"use client";

import {
  ArrowUpCircle,
  CheckCircle2,
  CornerUpLeft,
  History,
  ListChecks,
  Rocket,
  Send,
  ShieldCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Badge, EmptyState, cn } from "@/components/ui/primitives";
import { VersionBadge } from "@/components/studio/StatusBadges";
import { DECISION, formatDateTime, humanize, relativeTime, revisionStatus, stageLabel } from "@/lib/studio/labels";
import type { Decision, Revision, RevisionDecision } from "@/lib/studio/types";
import { personName } from "./utils";

const ICONS: Record<Decision, LucideIcon> = {
  APPROVED: CheckCircle2,
  APPROVED_WITH_MINOR_CHANGES: ListChecks,
  RETURNED_FOR_REVISION: CornerUpLeft,
  REJECTED: XCircle,
  ESCALATED: ArrowUpCircle,
  FORCE_APPROVED: ShieldCheck,
};

const DOT: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-500/12 dark:text-emerald-300 dark:ring-emerald-400/20",
  warning: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:ring-amber-400/20",
  danger: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:ring-rose-400/20",
  violet: "bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-500/12 dark:text-violet-300 dark:ring-violet-400/20",
  info: "bg-sky-50 text-sky-600 ring-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:ring-sky-400/20",
  brand: "bg-brand-50 text-brand-600 ring-brand-200 dark:bg-brand-400/12 dark:text-brand-300 dark:ring-brand-400/20",
  neutral: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-white/8 dark:text-slate-300 dark:ring-white/10",
};

type Event =
  | { kind: "decision"; at?: string; d: RevisionDecision }
  | { kind: "submitted"; at?: string }
  | { kind: "published"; at?: string; label?: string };

/** Every decision on the revision, newest first, with submit/publish milestones. */
export function DecisionTimeline({
  decisions,
  revision,
  className,
}: {
  decisions?: RevisionDecision[];
  /** Adds "Submitted" / "Published" milestones when given. */
  revision?: Revision | null;
  className?: string;
}) {
  const events: Event[] = (decisions ?? []).map((d) => ({ kind: "decision" as const, at: d.created_at, d }));
  if (revision?.submitted_at) events.push({ kind: "submitted", at: revision.submitted_at });
  if (revision?.published_at) events.push({ kind: "published", at: revision.published_at, label: revision.proposed_version_label });
  events.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));

  if (!events.length) {
    return (
      <EmptyState
        compact
        icon={History}
        title="No decisions yet"
        description="Each reviewer's decision will appear here with their comments and any conditions."
        className={className}
      />
    );
  }

  return (
    <ol className={cn("relative flex flex-col gap-5", className)}>
      <span aria-hidden className="absolute bottom-3 left-[17px] top-3 w-px bg-slate-200 dark:bg-ink-line" />
      {events.map((e, i) => {
        if (e.kind !== "decision") {
          const Icon = e.kind === "published" ? Rocket : Send;
          return (
            <li key={`${e.kind}-${i}`} className="relative flex gap-3">
              <span className={cn("relative z-[1] grid h-9 w-9 flex-shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-ink-surface", DOT[e.kind === "published" ? "brand" : "info"])}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 pt-1.5">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {e.kind === "published" ? `Published${e.label ? ` as version ${e.label}` : ""}` : "Submitted for review"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400" title={formatDateTime(e.at)}>
                  {relativeTime(e.at)} · {formatDateTime(e.at)}
                </p>
              </div>
            </li>
          );
        }
        const d = e.d;
        const meta = DECISION[d.decision] ?? { label: humanize(d.decision), tone: "neutral" as const };
        const Icon = ICONS[d.decision] ?? CheckCircle2;
        const conditions = (d.conditions ?? []).map((c) => (typeof c === "string" ? c : c.text)).filter(Boolean);
        return (
          <li key={d.id ?? i} className="relative flex gap-3">
            <span className={cn("relative z-[1] grid h-9 w-9 flex-shrink-0 place-items-center rounded-full ring-4 ring-white dark:ring-ink-surface", DOT[meta.tone])}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white p-3.5 dark:border-ink-line dark:bg-ink-raised/40">
              <div className="flex flex-wrap items-center gap-2">
                <Avatar name={personName(d.actor)} size="xs" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{personName(d.actor)}</span>
                <Badge size="xs" tone={meta.tone}>
                  {meta.label}
                </Badge>
                {d.stage && <span className="text-xs text-slate-500 dark:text-slate-400">{stageLabel(d.stage)}</span>}
                {d.round ? <span className="text-xs text-slate-400">· Round {d.round}</span> : null}
              </div>
              {d.comment && (
                <p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-slate-200 pl-3 text-sm leading-6 text-slate-700 dark:border-white/10 dark:text-slate-200">
                  {d.comment}
                </p>
              )}
              {conditions.length > 0 && (
                <ul className="mt-2 space-y-1 rounded-lg bg-amber-50/80 p-2.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                  {conditions.map((c, ci) => (
                    <li key={ci} className="flex gap-1.5">
                      <ListChecks className="mt-px h-3.5 w-3.5 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span title={formatDateTime(d.created_at)}>{relativeTime(d.created_at)}</span>
                {d.to_status && <span>→ {revisionStatus(d.to_status).label}</span>}
                {d.version_label && <VersionBadge label={d.version_label} size="xs" />}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
