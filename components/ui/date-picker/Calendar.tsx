"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../primitives";
import {
  addDays,
  addMonths,
  clampDay,
  compareDay,
  dayKey,
  formatDay,
  monthGrid,
  monthName,
  sameDay,
  sameMonth,
  startOfDay,
  startOfMonth,
  weekdayLabels,
  WEEK_STARTS_ON,
} from "./dateUtils";

type Panel = "days" | "months" | "years";

export type CalendarProps = {
  /** 1 on phones, 2 side by side for ranges on wider screens. */
  months?: 1 | 2;
  /** First visible month (controlled so presets can move it). */
  view: Date;
  onViewChange: (month: Date) => void;
  /** Single-date selection. */
  selected?: Date | null;
  /** Range selection. `previewEnd` is the hovered day while choosing the end. */
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  previewEnd?: Date | null;
  onHover?: (day: Date | null) => void;
  onSelect: (day: Date) => void;
  min?: Date | null;
  max?: Date | null;
  /** Move keyboard focus into the grid when mounted. */
  autoFocus?: boolean;
  className?: string;
};

const WEEKDAYS = weekdayLabels();

// Cells scale with the viewport's width AND height so the grid never pushes
// the modal past the screen on small or landscape phones.
const CELL = "h-[clamp(1.9rem,min(11vw,5.6dvh),2.6rem)]";

function isDisabled(d: Date, min?: Date | null, max?: Date | null) {
  return (!!min && compareDay(d, min) < 0) || (!!max && compareDay(d, max) > 0);
}

export function Calendar({
  months = 1,
  view,
  onViewChange,
  selected,
  rangeStart,
  rangeEnd,
  previewEnd,
  onHover,
  onSelect,
  min,
  max,
  autoFocus,
  className,
}: CalendarProps) {
  const [panel, setPanel] = useState<Panel>("days");
  const [focusDate, setFocusDate] = useState<Date>(() =>
    clampDay(startOfDay(selected ?? rangeStart ?? new Date()), min, max),
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const keyboardMove = useRef(!!autoFocus);
  const visible = Array.from({ length: months }, (_, i) => addMonths(startOfMonth(view), i));
  const today = startOfDay(new Date());

  // After keyboard navigation (or on open), move DOM focus to the focused day.
  useEffect(() => {
    if (!keyboardMove.current || panel !== "days") return;
    keyboardMove.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${dayKey(focusDate)}"]`)?.focus({ preventScroll: false });
  }, [focusDate, panel, view]);

  function ensureVisible(d: Date) {
    const first = visible[0];
    const last = visible[visible.length - 1];
    if (compareDay(d, first) < 0) onViewChange(startOfMonth(d));
    else if (compareDay(d, addMonths(last, 1)) >= 0) onViewChange(startOfMonth(addMonths(d, -(months - 1))));
  }

  function moveFocus(next: Date) {
    const d = clampDay(next, min, max);
    keyboardMove.current = true;
    setFocusDate(d);
    ensureVisible(d);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDate, -1),
      ArrowRight: () => addDays(focusDate, 1),
      ArrowUp: () => addDays(focusDate, -7),
      ArrowDown: () => addDays(focusDate, 7),
      Home: () => addDays(focusDate, -((focusDate.getDay() - WEEK_STARTS_ON + 7) % 7)),
      End: () => addDays(focusDate, 6 - ((focusDate.getDay() - WEEK_STARTS_ON + 7) % 7)),
      PageUp: () => addMonths(focusDate, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focusDate, e.shiftKey ? 12 : 1),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      moveFocus(fn());
    }
  }

  function pick(d: Date) {
    if (isDisabled(d, min, max)) return;
    setFocusDate(d);
    ensureVisible(d);
    onSelect(d);
  }

  const bandEnd = rangeEnd ?? previewEnd ?? null;
  const hasBand = !!rangeStart && !!bandEnd && compareDay(bandEnd, rangeStart) > 0;

  /* ── Month / year panels ── */
  if (panel !== "days") {
    const year = view.getFullYear();
    const blockStart = year - (year % 12);
    const headerLabel = panel === "months" ? String(year) : `${blockStart} – ${blockStart + 11}`;
    const step = panel === "months" ? 12 : 144;
    return (
      <div className={cn("flex min-w-0 flex-col", className)}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <NavButton label={panel === "months" ? "Previous year" : "Previous years"} onClick={() => onViewChange(addMonths(view, -step))} icon="prev" />
          <button
            type="button"
            onClick={() => setPanel(panel === "months" ? "years" : "days")}
            className="h-9 cursor-pointer rounded-lg px-3 font-display text-[15px] font-bold text-slate-900 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/8"
          >
            {headerLabel}
          </button>
          <NavButton label={panel === "months" ? "Next year" : "Next years"} onClick={() => onViewChange(addMonths(view, step))} icon="next" />
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {Array.from({ length: 12 }, (_, i) => {
            if (panel === "months") {
              const m = new Date(year, i, 1);
              const disabled = (!!min && compareDay(new Date(year, i + 1, 0), min) < 0) || (!!max && compareDay(m, max) > 0);
              const active = sameMonth(m, view);
              return (
                <PanelCell
                  key={i}
                  active={active}
                  current={sameMonth(m, today)}
                  disabled={disabled}
                  onClick={() => {
                    onViewChange(m);
                    setPanel("days");
                  }}
                >
                  {monthName(i, "short")}
                </PanelCell>
              );
            }
            const y = blockStart + i;
            const disabled = (!!min && y < min.getFullYear()) || (!!max && y > max.getFullYear());
            return (
              <PanelCell
                key={i}
                active={y === year}
                current={y === today.getFullYear()}
                disabled={disabled}
                onClick={() => {
                  onViewChange(new Date(y, view.getMonth(), 1));
                  setPanel("months");
                }}
              >
                {y}
              </PanelCell>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Day grid(s) ── */
  return (
    <div
      ref={gridRef}
      onKeyDown={onKeyDown}
      onMouseLeave={() => onHover?.(null)}
      className={cn("grid min-w-0 gap-x-6 gap-y-4", months === 2 && "md:grid-cols-2", className)}
    >
      {visible.map((month, mi) => {
        const days = monthGrid(month);
        return (
          <div key={dayKey(month)} className={cn("min-w-0", mi === 1 && "hidden md:block")}>
            <div className="mb-1.5 flex h-9 items-center justify-between gap-1">
              {mi === 0 ? (
                <NavButton label="Previous month" onClick={() => onViewChange(addMonths(view, -1))} icon="prev" />
              ) : (
                <span className="w-9" />
              )}
              <button
                type="button"
                onClick={() => {
                  if (mi === 1) onViewChange(month);
                  setPanel("months");
                }}
                aria-label={`${monthName(month.getMonth())} ${month.getFullYear()}, choose month and year`}
                className="h-9 min-w-0 cursor-pointer truncate rounded-lg px-2.5 font-display text-[15px] font-bold text-slate-900 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/8"
              >
                {monthName(month.getMonth())} {month.getFullYear()}
              </button>
              {/* On phones only the first month shows, so it carries both arrows. */}
              {mi === visible.length - 1 || months === 2 ? (
                <NavButton
                  label="Next month"
                  onClick={() => onViewChange(addMonths(view, 1))}
                  icon="next"
                  className={cn(months === 2 && mi === 0 && "md:invisible")}
                />
              ) : (
                <span className="w-9" />
              )}
            </div>

            <div role="grid" aria-label={`${monthName(month.getMonth())} ${month.getFullYear()}`} className="min-w-0">
              <div role="row" className="grid grid-cols-7">
                {WEEKDAYS.map((w) => (
                  <span
                    key={w.long}
                    role="columnheader"
                    aria-label={w.long}
                    className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500"
                  >
                    {w.short}
                  </span>
                ))}
              </div>
              {Array.from({ length: 6 }, (_, row) => (
                <div role="row" key={row} className="grid grid-cols-7">
                  {days.slice(row * 7, row * 7 + 7).map((d, col) => {
                    const outside = !sameMonth(d, month);
                    // With two months side by side, overflow days would repeat — leave them blank.
                    if (outside && months === 2) return <span key={col} role="gridcell" className={CELL} />;
                    const disabled = isDisabled(d, min, max);
                    const isSel = sameDay(d, selected) || sameDay(d, rangeStart) || sameDay(d, rangeEnd);
                    const isStart = hasBand && sameDay(d, rangeStart);
                    const isEnd = hasBand && sameDay(d, bandEnd);
                    const inBand = hasBand && compareDay(d, rangeStart!) > 0 && compareDay(d, bandEnd!) < 0;
                    const isPreviewEnd = !rangeEnd && sameDay(d, previewEnd) && hasBand;
                    const focused = sameDay(d, focusDate);
                    return (
                      <div
                        key={col}
                        role="gridcell"
                        aria-selected={isSel || undefined}
                        className={cn(
                          "flex min-w-0 items-center justify-center",
                          CELL,
                          !outside && inBand && "bg-brand-50 dark:bg-brand-400/12",
                          !outside && isStart && "bg-gradient-to-r from-transparent from-50% to-brand-50 to-50% dark:to-brand-400/12",
                          !outside && isEnd && "bg-gradient-to-l from-transparent from-50% to-brand-50 to-50% dark:to-brand-400/12",
                          // Round the band wherever it breaks: week edges and month edges.
                          inBand && (col === 0 || d.getDate() === 1) && "rounded-l-full",
                          inBand && (col === 6 || sameDay(addDays(d, 1), startOfMonth(addMonths(month, 1)))) && "rounded-r-full",
                        )}
                      >
                        <button
                          type="button"
                          data-day={dayKey(d)}
                          tabIndex={focused ? 0 : -1}
                          disabled={disabled}
                          aria-label={`${formatDay(d, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${sameDay(d, today) ? " (today)" : ""}`}
                          aria-pressed={isSel}
                          onClick={() => pick(d)}
                          onMouseEnter={() => onHover?.(d)}
                          onFocus={() => {
                            if (!sameDay(d, focusDate)) setFocusDate(d);
                            onHover?.(d);
                          }}
                          className={cn(
                            "relative grid aspect-square h-full max-h-full cursor-pointer place-items-center rounded-full text-[13px] tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-surface",
                            isSel
                              ? "bg-brand-600 font-bold text-white shadow-[0_6px_14px_-8px_rgba(45,106,79,0.9)] dark:bg-brand-400 dark:text-[#06130d]"
                              : isPreviewEnd
                                ? "border-2 border-dashed border-brand-400 font-semibold text-brand-700 dark:text-brand-300"
                                : inBand
                                  ? "font-medium text-brand-800 hover:bg-brand-100 dark:text-brand-200 dark:hover:bg-brand-400/20"
                                  : outside
                                    ? "text-slate-300 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-white/5"
                                    : "font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/8",
                            disabled && "cursor-not-allowed text-slate-300 line-through decoration-slate-300/70 hover:bg-transparent dark:text-slate-600 dark:hover:bg-transparent",
                          )}
                        >
                          {d.getDate()}
                          {sameDay(d, today) && !isSel && (
                            <span className="absolute bottom-[14%] h-1 w-1 rounded-full bg-brand-500 dark:bg-brand-300" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NavButton({ label, onClick, icon, className }: { label: string; onClick: () => void; icon: "prev" | "next"; className?: string }) {
  const Icon = icon === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid h-9 w-9 flex-shrink-0 cursor-pointer place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white",
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2.2} />
    </button>
  );
}

function PanelCell({
  active,
  current,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  current: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-[clamp(2.25rem,7dvh,3rem)] cursor-pointer rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 disabled:cursor-not-allowed disabled:opacity-35",
        active
          ? "bg-brand-600 text-white dark:bg-brand-400 dark:text-[#06130d]"
          : current
            ? "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-400/12 dark:text-brand-300"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/8",
      )}
    >
      {children}
    </button>
  );
}
