"use client";

import {
  Check,
  CheckCheck,
  Clock3,
  CornerUpLeft,
  FastForward,
  ListChecks,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, cn } from "@/components/ui/primitives";
import { STAGE, STAGE_STATUS, formatDate, formatDateTime, relativeTime, stageLabel } from "@/lib/studio/labels";
import type { RevisionStage, Stage, StageStatus } from "@/lib/studio/types";
import { currentRoundStages, personName } from "./utils";

type StepState = "done" | "active" | "waiting" | "returned" | "rejected" | "skipped";

function stepState(status: StageStatus, isCurrent: boolean): StepState {
  switch (status) {
    case "APPROVED":
    case "APPROVED_WITH_CONDITIONS":
      return "done";
    case "RETURNED":
      return "returned";
    case "REJECTED":
      return "rejected";
    case "SKIPPED":
      return "skipped";
    case "IN_REVIEW":
      return "active";
    default:
      return isCurrent ? "active" : "waiting";
  }
}

const NODE: Record<StepState, { icon: LucideIcon | null; className: string }> = {
  done: { icon: Check, className: "bg-brand-600 text-white ring-brand-600/15 dark:bg-brand-400 dark:text-[#06130d] dark:ring-brand-400/20" },
  active: {
    icon: Clock3,
    className: "bg-white text-sky-600 ring-sky-400/30 border-2 border-sky-500 dark:bg-ink-surface dark:text-sky-300 dark:border-sky-400",
  },
  waiting: {
    icon: null,
    className: "bg-white text-slate-400 ring-transparent border-2 border-slate-200 dark:bg-ink-surface dark:border-white/15",
  },
  returned: { icon: CornerUpLeft, className: "bg-amber-500 text-white ring-amber-400/20" },
  rejected: { icon: X, className: "bg-rose-600 text-white ring-rose-500/20" },
  skipped: { icon: FastForward, className: "bg-slate-200 text-slate-500 ring-transparent dark:bg-white/10 dark:text-slate-400" },
};

export type StageStepperProps = {
  /** All stages of the revision (every round); filtered to `round` and non-superseded. */
  stages?: RevisionStage[];
  round?: number;
  /** The stage awaiting a decision; highlighted. */
  currentStage?: Stage | null;
  /** Used when there are no stage rows yet (e.g. a route preview before submitting). */
  planned?: Stage[];
  /** Smaller variant without people/dates (for previews). */
  compact?: boolean;
  className?: string;
};

/**
 * The review pipeline for the current round: horizontal on wide screens,
 * vertical on mobile. Shows who has each stage, when it's due and conditions.
 */
export function StageStepper({ stages, round, currentStage, planned, compact, className }: StageStepperProps) {
  const rows = currentRoundStages(stages, round);
  const steps: RevisionStage[] = rows.length
    ? rows
    : (planned ?? []).map((stage, i) => ({ stage, sequence: i + 1, status: "PENDING" as StageStatus }));

  if (!steps.length) return null;

  return (
    <ol className={cn("flex flex-col md:flex-row", className)} aria-label="Review stages">
      {steps.map((s, i) => {
        const isCurrent = !!currentStage && s.stage === currentStage && (s.status === "PENDING" || s.status === "IN_REVIEW");
        const state = stepState(s.status, isCurrent && rows.length > 0);
        const node = NODE[state];
        const Icon = node.icon;
        const last = i === steps.length - 1;
        const meta = STAGE[s.stage];
        const statusMeta = STAGE_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
        const decided = state === "done" || state === "returned" || state === "rejected";
        const person = decided ? s.decided_by ?? s.assigned_reviewer : s.assigned_reviewer;
        const connectorDone = state === "done" || state === "skipped";

        return (
          <li key={`${s.stage}-${s.id ?? i}`} className={cn("relative flex min-w-0 gap-3 md:flex-1 md:flex-col md:gap-3 md:pr-4", !last && "pb-6 md:pb-0")}>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[15px] top-9 bottom-1 w-0.5 rounded-full md:left-11 md:right-1 md:top-[15px] md:bottom-auto md:h-0.5 md:w-auto",
                  connectorDone ? "bg-brand-500/70 dark:bg-brand-400/60" : "bg-slate-200 dark:bg-white/10",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-[1] grid h-8 w-8 flex-shrink-0 place-items-center rounded-full ring-4 transition-colors",
                node.className,
              )}
            >
              {state === "active" && <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/25" />}
              {Icon ? <Icon className="h-4 w-4" strokeWidth={2.4} /> : <span className="text-xs font-bold">{i + 1}</span>}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-display text-sm font-bold leading-5",
                  state === "waiting" || state === "skipped" ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white",
                )}
              >
                {meta?.label ?? stageLabel(s.stage)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{meta?.role}</p>

              {!compact && (
                <div className="mt-2 flex flex-col items-start gap-1.5">
                  {rows.length > 0 && (
                    <Badge size="xs" tone={isCurrent && s.status === "PENDING" ? "info" : statusMeta.tone}>
                      {isCurrent && s.status === "PENDING" ? "Up next" : statusMeta.label}
                    </Badge>
                  )}
                  {person?.name ? (
                    <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300" title={decided && s.decided_at ? formatDateTime(s.decided_at) : undefined}>
                      {decided ? <CheckCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" /> : <UserRound className="h-3.5 w-3.5 text-slate-400" />}
                      <span className="truncate">
                        {personName(person)}
                        {decided && s.decided_at && <span className="text-slate-400"> · {formatDate(s.decided_at)}</span>}
                      </span>
                    </p>
                  ) : (
                    isCurrent && <p className="text-xs italic text-slate-400">Not yet claimed</p>
                  )}
                  {!decided && state !== "skipped" && s.due_at && (
                    <p
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-medium",
                        s.is_overdue ? "text-rose-600 dark:text-rose-300" : "text-slate-500 dark:text-slate-400",
                      )}
                      title={formatDateTime(s.due_at)}
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      {s.is_overdue ? `Overdue · due ${relativeTime(s.due_at)}` : `Due ${relativeTime(s.due_at)}`}
                    </p>
                  )}
                  {!!s.conditions?.length && (
                    <ul className="mt-0.5 w-full space-y-1 rounded-lg bg-amber-50/80 p-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                      {s.conditions.map((c, ci) => (
                        <li key={ci} className="flex gap-1.5">
                          <ListChecks className="mt-px h-3.5 w-3.5 flex-shrink-0" />
                          <span className="min-w-0 break-words">{c.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** A compact chain of stage chips: "Academic review → QA → …". */
export function RouteChips({ stages, className }: { stages: Stage[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {stages.map((s, i) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10">
            {STAGE[s]?.label ?? stageLabel(s)}
          </span>
          {i < stages.length - 1 && <span className="text-slate-300 dark:text-slate-600">→</span>}
        </span>
      ))}
    </div>
  );
}
