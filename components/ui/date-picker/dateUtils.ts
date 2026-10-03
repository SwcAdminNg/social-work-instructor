// Plain local-time date helpers for the picker. Values are exchanged as the
// same strings a native <input type="datetime-local"> uses:
//   "YYYY-MM-DDTHH:mm" (with time) or "YYYY-MM-DD" (date only).

export type Time = { hour: number; minute: number };
export type Parsed = { day: Date; time: Time };

const LOCALE = "en-NG";
/** Weeks start on Monday (Nigerian/UK convention). */
export const WEEK_STARTS_ON = 1;

const pad = (n: number) => String(n).padStart(2, "0");

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Adds months, clamping the day (31 Jan + 1 month → 28/29 Feb). */
export function addMonths(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
}

export function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function sameDay(a?: Date | null, b?: Date | null) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Compare calendar days only (ignores time). */
export function compareDay(a: Date, b: Date) {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function withTime(day: Date, time: Time) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.hour, time.minute);
}

/** Parse "YYYY-MM-DD[THH:mm]" (or any Date-parsable string) as local time. */
export function parseValue(value?: string | Date | null): Parsed | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : { day: startOfDay(value), time: { hour: value.getHours(), minute: value.getMinutes() } };
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
  if (m && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    const day = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return { day, time: { hour: Number(m[4] ?? 0), minute: Number(m[5] ?? 0) } };
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : parseValue(d);
}

export function toValue(day: Date, time: Time, includeTime: boolean) {
  return includeTime ? `${dayKey(day)}T${pad(time.hour)}:${pad(time.minute)}` : dayKey(day);
}

/** The 42 days (6 weeks) shown for a month, starting on WEEK_STARTS_ON. */
export function monthGrid(month: Date) {
  const first = startOfMonth(month);
  const offset = (first.getDay() - WEEK_STARTS_ON + 7) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function weekdayLabels() {
  const base = new Date(2024, 0, 1); // a Monday
  const fmt = new Intl.DateTimeFormat(LOCALE, { weekday: "short" });
  const long = new Intl.DateTimeFormat(LOCALE, { weekday: "long" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(base, (i + WEEK_STARTS_ON - 1 + 7) % 7);
    return { short: fmt.format(d).slice(0, 2), long: long.format(d) };
  });
}

export function monthName(month: number, style: "long" | "short" = "long") {
  return new Intl.DateTimeFormat(LOCALE, { month: style }).format(new Date(2024, month, 1));
}

export function formatDay(d: Date, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat(LOCALE, opts).format(d);
}

export function formatTime(t: Time) {
  const h12 = t.hour % 12 || 12;
  return `${h12}:${pad(t.minute)} ${t.hour < 12 ? "AM" : "PM"}`;
}

/** "Tue, 5 Nov 2026 · 2:00 PM" */
export function formatParsed(p: Parsed, includeTime: boolean) {
  return includeTime ? `${formatDay(p.day)} · ${formatTime(p.time)}` : formatDay(p.day);
}

export function daysBetween(a: Date, b: Date) {
  return Math.round(compareDay(b, a) / 86_400_000);
}

export function clampDay(d: Date, min?: Date | null, max?: Date | null) {
  if (min && compareDay(d, min) < 0) return startOfDay(min);
  if (max && compareDay(d, max) > 0) return startOfDay(max);
  return d;
}
