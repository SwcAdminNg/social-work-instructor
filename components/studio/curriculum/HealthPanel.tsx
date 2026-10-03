"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Clock3, ClipboardList, Eye, Layers3, PlayCircle } from "lucide-react";
import { Card, cn } from "@/components/ui/primitives";
import { formatMinutes } from "@/lib/studio/labels";
import type { HealthIssue } from "@/lib/studio/health";
import type { ManagedCourse } from "@/lib/studio/types";
import { itemMinutes } from "./itemMeta";

export function courseStats(course?: ManagedCourse) {
  const sections = course?.sections ?? [];
  const items = sections.flatMap((s) => s.items ?? []);
  return {
    modules: sections.length,
    lessons: items.filter((i) => i.item_type !== "ASSESSMENT").length,
    assessments: items.filter((i) => i.item_type === "ASSESSMENT").length,
    previews: items.filter((i) => i.is_preview).length,
    minutes: course?.estimated_total_minutes || items.reduce((n, i) => n + itemMinutes(i), 0),
  };
}

function shortMessage(issue: HealthIssue) {
  // "Module › Lesson: problem" → keep the problem, show where separately.
  const idx = issue.message.lastIndexOf(": ");
  if (idx === -1) return { what: issue.message, where: null as string | null };
  return { what: issue.message.slice(idx + 2), where: issue.message.slice(0, idx) };
}

export function HealthPanel({
  course,
  issues,
  onSelect,
  className,
}: {
  course?: ManagedCourse;
  issues: HealthIssue[];
  onSelect: (issue: HealthIssue) => void;
  className?: string;
}) {
  const stats = courseStats(course);
  const errors = issues.filter((i) => i.severity === "error").length;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-ink-line">
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-xl",
              issues.length === 0
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300"
                : errors
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-300"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-500/12 dark:text-amber-300",
            )}
          >
            {issues.length === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-slate-900 dark:text-white">Course health</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {issues.length === 0
                ? "Ready for reviewers"
                : `${errors ? `${errors} to fix` : ""}${errors && issues.length - errors ? " · " : ""}${issues.length - errors ? `${issues.length - errors} to check` : ""}`}
            </p>
          </div>
        </div>
        {issues.length === 0 ? (
          <p className="px-4 py-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Nothing a reviewer would bounce — uploads are complete and every quiz has its answers.
          </p>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto p-1.5">
            {issues.map((issue, i) => {
              const { what, where } = shortMessage(issue);
              const Icon = issue.severity === "error" ? AlertCircle : AlertTriangle;
              return (
                <li key={`${issue.message}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(issue)}
                    className="group flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                  >
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 flex-shrink-0",
                        issue.severity === "error" ? "text-rose-500" : "text-amber-500",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-5 text-slate-700 first-letter:uppercase dark:text-slate-200">{what}</span>
                      {where && <span className="block truncate text-xs text-slate-400">{where}</span>}
                    </span>
                    <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card padded={false} className="p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">At a glance</p>
        <dl className="grid grid-cols-2 gap-3">
          {[
            { label: "Modules", value: stats.modules, icon: Layers3 },
            { label: "Lessons", value: stats.lessons, icon: PlayCircle },
            { label: "Assessments", value: stats.assessments, icon: ClipboardList },
            { label: "Free previews", value: stats.previews, icon: Eye },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.03]">
              <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <s.icon className="h-3.5 w-3.5" /> {s.label}
              </dt>
              <dd className="mt-1 font-display text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{s.value}</dd>
            </div>
          ))}
          <div className="col-span-2 flex items-center justify-between rounded-xl bg-brand-50/70 px-3 py-2.5 dark:bg-brand-400/[0.08]">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">
              <Clock3 className="h-3.5 w-3.5" /> Estimated length
            </dt>
            <dd className="font-display text-sm font-extrabold text-brand-800 dark:text-brand-200">{formatMinutes(stats.minutes) || "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
