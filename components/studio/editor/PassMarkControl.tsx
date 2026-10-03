"use client";

import { useId } from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { cn } from "@/components/ui/primitives";

/** Platform default for `certificate_pass_mark_percentage` (CERTIFICATES_INSTRUCTOR_ADMIN_API §3). */
export const DEFAULT_CERTIFICATE_PASS_MARK = 70;

const PRESETS = [50, 60, 70, 80, 90];
// Three sample "best scores" used to show what the pass mark means in practice.
const SAMPLE = [85, 62, 74];

/**
 * Picker for the overall score a learner needs to earn the course certificate:
 * the average of their best score on every assessment in the course.
 */
export function PassMarkControl({
  value,
  onChange,
  disabled,
  compact,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Smaller layout without the worked example (used in the create wizard). */
  compact?: boolean;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(Number.isFinite(n) ? n : 0)));
  const average = Math.round(SAMPLE.reduce((a, b) => a + b, 0) / SAMPLE.length);
  const samplePasses = average >= value;

  return (
    <div className={cn("flex flex-col gap-4", disabled && "opacity-60")}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">{value}</span>
          <span className="text-lg font-bold text-slate-400">%</span>
          <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">overall score</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-n`} className="sr-only">
            Pass mark percentage
          </label>
          <div className="relative">
            <input
              id={`${id}-n`}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(clamp(Number(e.target.value)))}
              className="h-9 w-20 rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-sm font-semibold tabular-nums text-slate-900 outline-none transition [appearance:textfield] focus:border-brand-400 focus:ring-4 focus:ring-brand-400/15 disabled:cursor-not-allowed dark:border-ink-line dark:bg-ink-page/60 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
          </div>
        </div>
      </div>

      <div className="relative pt-1">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          disabled={disabled}
          aria-label="Pass mark percentage"
          aria-valuetext={`${value} percent`}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          style={{ "--fill": `${value}%` } as React.CSSProperties}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[linear-gradient(to_right,#40916c_var(--fill),rgb(148_163_184/0.25)_var(--fill))] accent-brand-600 disabled:cursor-not-allowed [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(45,106,79,0.5)] dark:[&::-webkit-slider-thumb]:border-ink-surface dark:[&::-webkit-slider-thumb]:bg-brand-400"
        />
        {/* Default marker */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-5 -translate-x-1/2 text-[10px] font-semibold text-slate-400"
          style={{ left: `${DEFAULT_CERTIFICATE_PASS_MARK}%` }}
        >
          ▲ default
        </span>
        <div aria-hidden="true" className="mt-5 flex justify-between text-[10px] font-medium text-slate-400">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common pass marks">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            aria-pressed={p === value}
            onClick={() => onChange(p)}
            className={cn(
              "h-8 cursor-pointer rounded-full border px-3 text-xs font-semibold tabular-nums transition disabled:cursor-not-allowed",
              p === value
                ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-400/12 dark:text-brand-300"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-ink-line dark:text-slate-300 dark:hover:bg-white/5",
            )}
          >
            {p}%{p === DEFAULT_CERTIFICATE_PASS_MARK ? " · default" : ""}
          </button>
        ))}
      </div>

      {!compact && (
        <div className="rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-600 dark:bg-white/[0.03] dark:text-slate-300">
          <p className="font-semibold text-slate-700 dark:text-slate-200">Example</p>
          <p className="mt-1">
            A learner whose best scores are {SAMPLE.map((s) => `${s}%`).join(", ")} averages{" "}
            <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{average}%</span>
            {" — "}
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold",
                samplePasses ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300",
              )}
            >
              {samplePasses ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
              {samplePasses ? "earns the certificate" : "doesn't earn it yet"}
            </span>
            .
          </p>
        </div>
      )}
    </div>
  );
}
