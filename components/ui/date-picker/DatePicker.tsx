"use client";

import { useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ArrowRight, CalendarDays, CalendarRange, Clock, X } from "lucide-react";
import { Button, Select, cn } from "../primitives";
import { Calendar } from "./Calendar";
import {
  addDays,
  addMonths,
  clampDay,
  compareDay,
  daysBetween,
  formatDay,
  formatParsed,
  formatTime,
  parseValue,
  sameDay,
  startOfDay,
  startOfMonth,
  toValue,
  withTime,
  type Parsed,
  type Time,
} from "./dateUtils";

/* ───────────────────────── Modal shell ───────────────────────── */

/**
 * Bottom sheet on phones, centred dialog from `sm` up. Never larger than the
 * viewport in either direction (dvh accounts for mobile browser chrome): the
 * header and footer stay put and only the body scrolls.
 */
function PickerModal({
  open,
  onOpenChange,
  title,
  description,
  width,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  width: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[80] animate-fade-in bg-slate-950/50 backdrop-blur-[2px]" />
        <RadixDialog.Content
          style={{ "--picker-w": width } as React.CSSProperties}
          onOpenAutoFocus={(e) => e.preventDefault() /* the calendar focuses the selected day itself */}
          className={cn(
            "fixed z-[81] flex flex-col overflow-hidden border-slate-200 bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.5)] outline-none dark:border-ink-line dark:bg-ink-surface",
            // phones: bottom sheet, full width, at most the full dynamic viewport height
            "inset-x-0 bottom-0 max-h-[100dvh] w-full rounded-t-3xl border-t pb-[env(safe-area-inset-bottom)]",
            // sm+: centred card, inset 1rem from every edge at most
            "sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[calc(100dvh-2rem)] sm:w-[min(calc(100vw-2rem),var(--picker-w))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-0",
          )}
        >
          <div className="flex min-h-0 flex-1 animate-pop-in flex-col">
            <div className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-slate-200 sm:hidden dark:bg-white/15" aria-hidden="true" />
            <div className="flex flex-shrink-0 items-center gap-3 px-4 pb-2 pt-3 sm:px-5 sm:pt-4">
              <div className="min-w-0 flex-1">
                <RadixDialog.Title className="truncate font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </RadixDialog.Title>
                <RadixDialog.Description className="sr-only">{description}</RadixDialog.Description>
              </div>
              <RadixDialog.Close asChild>
                <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Close" className="-mr-1.5" />
              </RadixDialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5">{children}</div>
            <div className="flex flex-shrink-0 flex-col gap-2.5 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5 dark:border-ink-line dark:bg-white/[0.02]">
              {footer}
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ───────────────────────── Time ───────────────────────── */

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

function TimeField({
  label,
  value,
  onChange,
  minuteStep = 5,
  quick,
}: {
  label: string;
  value: Time;
  onChange: (t: Time) => void;
  minuteStep?: number;
  quick?: Time[];
}) {
  const pm = value.hour >= 12;
  const h12 = value.hour % 12 || 12;
  const minutes = Array.from(new Set([...Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep), value.minute])).sort(
    (a, b) => a - b,
  );
  const setHour12 = (h: number, isPm = pm) => onChange({ ...value, hour: (h % 12) + (isPm ? 12 : 0) });

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-ink-line">
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        <Clock className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </p>
      <div className="flex min-w-0 items-center gap-1.5">
        <Select aria-label={`${label}: hour`} value={h12} onChange={(e) => setHour12(Number(e.target.value))} className="h-9 min-w-0 flex-1 pr-7 tabular-nums">
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </Select>
        <span className="font-bold text-slate-400">:</span>
        <Select
          aria-label={`${label}: minutes`}
          value={value.minute}
          onChange={(e) => onChange({ ...value, minute: Number(e.target.value) })}
          className="h-9 min-w-0 flex-1 pr-7 tabular-nums"
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </Select>
        <div className="inline-flex flex-shrink-0 rounded-lg bg-slate-100 p-0.5 dark:bg-white/5" role="group" aria-label={`${label}: AM or PM`}>
          {(["AM", "PM"] as const).map((p) => {
            const active = (p === "PM") === pm;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                onClick={() => setHour12(h12, p === "PM")}
                className={cn(
                  "h-8 cursor-pointer rounded-md px-2 text-xs font-bold transition sm:px-2.5",
                  active ? "bg-white text-slate-900 shadow-sm dark:bg-ink-raised dark:text-white" : "text-slate-500 dark:text-slate-400",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
      {quick && (
        <div className="mt-2 flex flex-wrap gap-1">
          {quick.map((t) => {
            const active = t.hour === value.hour && t.minute === value.minute;
            return (
              <button
                key={`${t.hour}:${t.minute}`}
                type="button"
                onClick={() => onChange(t)}
                className={cn(
                  "h-7 cursor-pointer rounded-full px-2.5 text-[11px] font-semibold transition",
                  active
                    ? "bg-brand-600 text-white dark:bg-brand-400 dark:text-[#06130d]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10",
                )}
              >
                {formatTime(t)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const QUICK_TIMES: Time[] = [
  { hour: 9, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 14, minute: 0 },
  { hour: 17, minute: 0 },
  { hour: 23, minute: 59 },
];

function Chip({ active, disabled, onClick, children }: { active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-8 flex-shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-400/12 dark:text-brand-300"
          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-ink-line dark:text-slate-300 dark:hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}

/* ───────────────────────── Trigger ───────────────────────── */

const TRIGGER =
  "flex w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white text-left text-sm shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition hover:border-slate-300 focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-400/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-ink-line dark:bg-ink-page/60 dark:hover:border-white/20 dark:disabled:bg-white/[0.03]";

function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

/* ───────────────────────── Single date ───────────────────────── */

export type DatePickerProps = {
  /** "YYYY-MM-DDTHH:mm" (withTime) or "YYYY-MM-DD"; "" when empty. */
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  /** Earliest allowed moment (a Date keeps its time, e.g. `new Date()` for "in the future"). */
  min?: string | Date | null;
  max?: string | Date | null;
  /** Time used when a day is picked and no time was set yet. */
  defaultTime?: Time;
  minuteStep?: number;
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  placeholder?: string;
  /** Heading of the picker modal. */
  title?: string;
  className?: string;
};

export function DatePicker({
  value,
  onChange,
  withTime: includeTime = true,
  min,
  max,
  defaultTime = { hour: 9, minute: 0 },
  minuteStep = 5,
  clearable,
  disabled,
  invalid,
  id,
  placeholder,
  title,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseValue(value);
  const minP = parseValue(min ?? null);
  const maxP = parseValue(max ?? null);

  return (
    <div className={cn("relative min-w-0", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(TRIGGER, "h-10 pl-3", clearable && parsed && !disabled ? "pr-10" : "pr-3", invalid && "border-rose-400 dark:border-rose-500/60")}
      >
        <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <span className={cn("min-w-0 truncate", parsed ? "font-medium text-slate-900 dark:text-white" : "text-slate-400")}>
          {parsed ? formatParsed(parsed, includeTime) : (placeholder ?? (includeTime ? "Pick a date and time" : "Pick a date"))}
        </span>
      </button>
      {clearable && parsed && !disabled && <ClearButton label="Clear date" onClick={() => onChange("")} />}
      {open && (
        <SinglePickerModal
          onClose={() => setOpen(false)}
          initial={parsed}
          includeTime={includeTime}
          minP={minP}
          maxP={maxP}
          defaultTime={defaultTime}
          minuteStep={minuteStep}
          clearable={clearable}
          title={title ?? (includeTime ? "Choose date and time" : "Choose a date")}
          onApply={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SinglePickerModal({
  onClose,
  initial,
  includeTime,
  minP,
  maxP,
  defaultTime,
  minuteStep,
  clearable,
  title,
  onApply,
}: {
  onClose: () => void;
  initial: Parsed | null;
  includeTime: boolean;
  minP: Parsed | null;
  maxP: Parsed | null;
  defaultTime: Time;
  minuteStep: number;
  clearable?: boolean;
  title: string;
  onApply: (value: string) => void;
}) {
  const minDay = minP?.day ?? null;
  const maxDay = maxP?.day ?? null;
  const [day, setDay] = useState<Date | null>(initial?.day ?? null);
  const [time, setTime] = useState<Time>(initial?.time ?? defaultTime);
  const [view, setView] = useState<Date>(() => startOfMonth(initial?.day ?? clampDay(startOfDay(new Date()), minDay, maxDay)));

  const today = startOfDay(new Date());
  const shortcuts = [
    { label: "Today", day: today },
    { label: "Tomorrow", day: addDays(today, 1) },
    { label: "In a week", day: addDays(today, 7) },
    { label: "In a month", day: addMonths(today, 1) },
  ];
  const outOfRange = (d: Date) => (!!minDay && compareDay(d, minDay) < 0) || (!!maxDay && compareDay(d, maxDay) > 0);

  // With a time-precise minimum (e.g. "must be in the future"), the chosen moment must be after it.
  const moment = day ? (includeTime ? withTime(day, time) : day) : null;
  const tooEarly = !!moment && !!minP && includeTime && moment.getTime() < withTime(minP.day, minP.time).getTime();
  const tooLate = !!moment && !!maxP && includeTime && moment.getTime() > withTime(maxP.day, maxP.time).getTime();

  function choose(d: Date) {
    setDay(d);
    setView((v) => (d.getMonth() === v.getMonth() && d.getFullYear() === v.getFullYear() ? v : startOfMonth(d)));
  }

  return (
    <PickerModal
      open
      onOpenChange={(v) => !v && onClose()}
      title={title}
      description="Use the arrow keys to move between days and Enter to choose one."
      width="23.5rem"
      footer={
        <>
          <p className={cn("min-h-5 truncate text-[13px]", tooEarly || tooLate ? "font-medium text-rose-600 dark:text-rose-300" : "text-slate-600 dark:text-slate-300")}>
            {tooEarly
              ? `Choose a time after ${formatParsed(minP!, true)}`
              : tooLate
                ? `Choose a time before ${formatParsed(maxP!, true)}`
                : day
                  ? formatParsed({ day, time }, includeTime)
                  : "No date selected"}
          </p>
          <div className="flex items-center gap-2">
            {clearable && (
              <Button variant="ghost" size="sm" onClick={() => onApply("")} className="mr-auto">
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose} className={cn(!clearable && "ml-auto")}>
              Cancel
            </Button>
            <Button size="sm" disabled={!day || tooEarly || tooLate} onClick={() => day && onApply(toValue(day, time, includeTime))}>
              Done
            </Button>
          </div>
        </>
      }
    >
      <div className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
        {shortcuts.map((s) => (
          <Chip key={s.label} active={sameDay(day, s.day)} disabled={outOfRange(s.day)} onClick={() => choose(s.day)}>
            {s.label}
          </Chip>
        ))}
      </div>
      <Calendar view={view} onViewChange={setView} selected={day} onSelect={choose} min={minDay} max={maxDay} autoFocus />
      {includeTime && (
        <div className="mt-3">
          <TimeField label="Time" value={time} onChange={setTime} minuteStep={minuteStep} quick={QUICK_TIMES.slice(0, 4)} />
        </div>
      )}
    </PickerModal>
  );
}

/* ───────────────────────── Date range ───────────────────────── */

export type DateRange = { start: string; end: string };

export type DateRangePickerProps = {
  start: string;
  end: string;
  onChange: (range: DateRange) => void;
  withTime?: boolean;
  min?: string | Date | null;
  max?: string | Date | null;
  defaultStartTime?: Time;
  defaultEndTime?: Time;
  minuteStep?: number;
  startLabel?: string;
  endLabel?: string;
  clearable?: boolean;
  disabled?: boolean;
  /** Mark one or both ends as invalid. */
  invalid?: boolean | "start" | "end";
  id?: string;
  title?: string;
  /** Duration shortcuts (1 week … 1 year). */
  presets?: boolean;
  className?: string;
};

const PRESETS: { label: string; apply: (d: Date) => Date }[] = [
  { label: "1 week", apply: (d) => addDays(d, 7) },
  { label: "2 weeks", apply: (d) => addDays(d, 14) },
  { label: "1 month", apply: (d) => addMonths(d, 1) },
  { label: "3 months", apply: (d) => addMonths(d, 3) },
  { label: "6 months", apply: (d) => addMonths(d, 6) },
  { label: "1 year", apply: (d) => addMonths(d, 12) },
];

export function DateRangePicker({
  start,
  end,
  onChange,
  withTime: includeTime = true,
  min,
  max,
  defaultStartTime = { hour: 9, minute: 0 },
  defaultEndTime = { hour: 23, minute: 59 },
  minuteStep = 5,
  startLabel = "Starts",
  endLabel = "Ends",
  clearable,
  disabled,
  invalid,
  id,
  title,
  presets = true,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState<null | "start" | "end">(null);
  const s = parseValue(start);
  const e = parseValue(end);
  const badStart = invalid === true || invalid === "start";
  const badEnd = invalid === true || invalid === "end";
  const fmt = (p: Parsed) =>
    includeTime ? `${formatDay(p.day, { day: "numeric", month: "short", year: "numeric" })}, ${formatTime(p.time)}` : formatDay(p.day, { day: "numeric", month: "short", year: "numeric" });

  const half = (which: "start" | "end", p: Parsed | null, label: string, bad: boolean) => (
    <button
      id={which === "start" ? id : undefined}
      type="button"
      disabled={disabled}
      aria-haspopup="dialog"
      onClick={() => setOpen(which)}
      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 disabled:cursor-not-allowed dark:hover:bg-white/5"
    >
      <span className="min-w-0">
        <span className={cn("block text-[11px] font-semibold uppercase tracking-wider", bad ? "text-rose-500" : "text-slate-400 dark:text-slate-500")}>{label}</span>
        <span className={cn("block truncate text-sm", p ? "font-medium text-slate-900 dark:text-white" : "text-slate-400")}>
          {p ? fmt(p) : "Not set"}
        </span>
      </span>
    </button>
  );

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        className={cn(
          // Stacked on phones, side by side from sm.
          "flex w-full min-w-0 flex-col gap-0 rounded-lg border border-slate-200 bg-white p-1 pr-9 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-400/15 sm:flex-row sm:items-center sm:pr-1 dark:border-ink-line dark:bg-ink-page/60",
          (badStart || badEnd) && "border-rose-400 dark:border-rose-500/60",
          disabled && "bg-slate-50 dark:bg-white/[0.03]",
        )}
      >
        <span className="hidden flex-shrink-0 pl-2 sm:block">
          <CalendarRange className="h-4 w-4 text-slate-400" />
        </span>
        {half("start", s, startLabel, badStart)}
        <ArrowRight className="mx-auto hidden h-4 w-4 flex-shrink-0 text-slate-300 sm:block dark:text-slate-600" />
        <div className="mx-2.5 h-px bg-slate-100 sm:hidden dark:bg-ink-line" />
        {half("end", e, endLabel, badEnd)}
        {clearable && (s || e) && !disabled && (
          <button
            type="button"
            aria-label="Clear dates"
            onClick={() => onChange({ start: "", end: "" })}
            className="absolute right-1.5 top-1.5 grid h-7 w-7 cursor-pointer place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:static sm:mr-1 dark:hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {s && e && !badStart && !badEnd && compareDay(e.day, s.day) >= 0 && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {daysBetween(s.day, e.day) + 1} days
        </p>
      )}
      {open && (
        <RangePickerModal
          focus={open}
          onClose={() => setOpen(null)}
          initialStart={s}
          initialEnd={e}
          includeTime={includeTime}
          minP={parseValue(min ?? null)}
          maxP={parseValue(max ?? null)}
          defaultStartTime={defaultStartTime}
          defaultEndTime={defaultEndTime}
          minuteStep={minuteStep}
          startLabel={startLabel}
          endLabel={endLabel}
          presets={presets}
          title={title ?? "Choose dates"}
          onApply={(range) => {
            onChange(range);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

function RangePickerModal({
  focus,
  onClose,
  initialStart,
  initialEnd,
  includeTime,
  minP,
  maxP,
  defaultStartTime,
  defaultEndTime,
  minuteStep,
  startLabel,
  endLabel,
  presets,
  title,
  onApply,
}: {
  focus: "start" | "end";
  onClose: () => void;
  initialStart: Parsed | null;
  initialEnd: Parsed | null;
  includeTime: boolean;
  minP: Parsed | null;
  maxP: Parsed | null;
  defaultStartTime: Time;
  defaultEndTime: Time;
  minuteStep: number;
  startLabel: string;
  endLabel: string;
  presets: boolean;
  title: string;
  onApply: (range: DateRange) => void;
}) {
  const minDay = minP?.day ?? null;
  const maxDay = maxP?.day ?? null;
  const [startDay, setStartDay] = useState<Date | null>(initialStart?.day ?? null);
  const [endDay, setEndDay] = useState<Date | null>(initialEnd?.day ?? null);
  const [startTime, setStartTime] = useState<Time>(initialStart?.time ?? defaultStartTime);
  const [endTime, setEndTime] = useState<Time>(initialEnd?.time ?? defaultEndTime);
  const [editing, setEditing] = useState<"start" | "end">(focus === "end" && initialStart ? "end" : "start");
  const [hover, setHover] = useState<Date | null>(null);
  const [view, setView] = useState<Date>(() => {
    const anchor = (focus === "end" ? initialEnd?.day : null) ?? initialStart?.day ?? clampDay(startOfDay(new Date()), minDay, maxDay);
    return startOfMonth(anchor);
  });

  function choose(d: Date) {
    if (editing === "start" || !startDay) {
      setStartDay(d);
      // Keep an existing end only if it's still after the new start.
      if (endDay && compareDay(endDay, d) < 0) setEndDay(null);
      setEditing("end");
      return;
    }
    if (compareDay(d, startDay) < 0) {
      // Picked before the start while choosing the end: treat it as a new start.
      setStartDay(d);
      return;
    }
    setEndDay(d);
    setEditing("start");
  }

  function applyPreset(fn: (d: Date) => Date) {
    const from = startDay ?? clampDay(startOfDay(new Date()), minDay, maxDay);
    const to = clampDay(fn(from), minDay, maxDay);
    setStartDay(from);
    setEndDay(to);
    setEditing("start");
    setView(startOfMonth(from));
  }

  const startMoment = startDay ? withTime(startDay, includeTime ? startTime : { hour: 0, minute: 0 }) : null;
  const endMoment = endDay ? withTime(endDay, includeTime ? endTime : { hour: 0, minute: 0 }) : null;
  const backwards = !!startMoment && !!endMoment && (includeTime ? endMoment.getTime() <= startMoment.getTime() : compareDay(endMoment, startMoment) < 0);
  const ready = !!startDay && !!endDay && !backwards;

  const endpoint = (which: "start" | "end") => {
    const day = which === "start" ? startDay : endDay;
    const active = editing === which;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => setEditing(which === "end" && !startDay ? "start" : which)}
        className={cn(
          "min-w-0 flex-1 cursor-pointer rounded-xl border px-3 py-2 text-left transition",
          active
            ? "border-brand-500 bg-brand-50/70 ring-4 ring-brand-400/15 dark:border-brand-400 dark:bg-brand-400/10"
            : "border-slate-200 hover:border-slate-300 dark:border-ink-line dark:hover:border-white/20",
        )}
      >
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {which === "start" ? startLabel : endLabel}
        </span>
        <span className={cn("block truncate text-sm", day ? "font-semibold text-slate-900 dark:text-white" : "text-slate-400")}>
          {day ? formatDay(day, { weekday: "short", day: "numeric", month: "short" }) : active ? "Pick a day" : "Not set"}
        </span>
      </button>
    );
  };

  return (
    <PickerModal
      open
      onOpenChange={(v) => !v && onClose()}
      title={title}
      description={`Pick the ${startLabel.toLowerCase()} day, then the ${endLabel.toLowerCase()} day.`}
      width="43rem"
      footer={
        <>
          <p className={cn("min-h-5 truncate text-[13px]", backwards ? "font-medium text-rose-600 dark:text-rose-300" : "text-slate-600 dark:text-slate-300")}>
            {backwards
              ? `${endLabel} must be after ${startLabel.toLowerCase()}`
              : startDay && endDay
                ? `${daysBetween(startDay, endDay) + 1} days · ${formatDay(startDay, { day: "numeric", month: "short" })} – ${formatDay(endDay, { day: "numeric", month: "short", year: "numeric" })}`
                : startDay
                  ? `Now pick the ${endLabel.toLowerCase()} day`
                  : `Pick the ${startLabel.toLowerCase()} day`}
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!ready}
              onClick={() =>
                startDay && endDay && onApply({ start: toValue(startDay, startTime, includeTime), end: toValue(endDay, endTime, includeTime) })
              }
            >
              Apply
            </Button>
          </div>
        </>
      }
    >
      <div className="mb-3 flex items-stretch gap-2">
        {endpoint("start")}
        <ArrowRight className="h-4 w-4 flex-shrink-0 self-center text-slate-300 dark:text-slate-600" />
        {endpoint("end")}
      </div>

      {presets && (
        <div className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5">
          {PRESETS.map((p) => {
            const from = startDay ?? startOfDay(new Date());
            const active = !!startDay && !!endDay && sameDay(endDay, p.apply(from));
            return (
              <Chip key={p.label} active={active} onClick={() => applyPreset(p.apply)}>
                {p.label}
              </Chip>
            );
          })}
        </div>
      )}

      <Calendar
        months={2}
        view={view}
        onViewChange={setView}
        rangeStart={startDay}
        rangeEnd={endDay}
        previewEnd={editing === "end" && startDay && !endDay ? hover : null}
        onHover={setHover}
        onSelect={choose}
        min={minDay}
        max={maxDay}
        autoFocus
      />

      {includeTime && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          <TimeField label={`${startLabel} at`} value={startTime} onChange={setStartTime} minuteStep={minuteStep} quick={QUICK_TIMES.slice(0, 3)} />
          <TimeField label={`${endLabel} at`} value={endTime} onChange={setEndTime} minuteStep={minuteStep} quick={[QUICK_TIMES[3], QUICK_TIMES[4]]} />
        </div>
      )}
    </PickerModal>
  );
}
